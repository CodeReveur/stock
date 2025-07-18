import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const start = searchParams.get("start")
      ? new Date(searchParams.get("start")!)
      : new Date("2000-01-01");
    const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date();

    const orders = await prisma.orders.findMany({
      where: {
        status: "Completed",
        created_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        customer: true,
        created_at: true,
        product: true,
        amount: true,
      },
    });

    const customerMap: Record<string, any> = {};

    for (const order of orders) {
      const customerId = order.customer;
      if (!customerMap[customerId]) {
        const customerData = await prisma.customers.findUnique({
          where: { id: customerId },
          select: {
            name: true,
            email: true,
            phone: true,
            created_at: true,
          },
        });

        if (!customerData) continue;

        customerMap[customerId] = {
          id: customerId,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          joined_date: customerData.created_at,
          sales_quantity: 0,
          sales_amount: 0,
          products: {},
        };
      }

      const parsedProducts = JSON.parse(order.product); // [{id, qty}]
      for (const item of parsedProducts) {
        const product = await prisma.products.findUnique({
          where: { id: item.id },
          select: { name: true, unit: true },
        });

        if (product) {
          const productName = product.name;
          if (!customerMap[customerId].products[productName]) {
            customerMap[customerId].products[productName] = 0;
          }
          customerMap[customerId].products[productName] += item.qty;
          customerMap[customerId].sales_quantity += item.qty;
        }
      }

      customerMap[customerId].sales_amount += Number(order.amount);
    }

    const result = Object.values(customerMap)
      .map((customer) => {
        const productList = Object.entries(customer.products).map(([name, quantity]) => ({
          name,
          quantity,
        }));

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          joined_date: customer.joined_date,
          sales_quantity: customer.sales_quantity,
          sales_amount: customer.sales_amount,
          products: productList,
        };
      })
      .filter((c) => {
        const matchesCustomer =
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search);

        const matchesProduct = c.products.some((p) =>
          p.name.toLowerCase().includes(search)
        );

        return search === "" || matchesCustomer || matchesProduct;
      })
      .sort((a, b) => b.sales_amount - a.sales_amount); // 🔥 Sort by top spending customers

    return NextResponse.json( result, { status: 200 });
  } catch (err) {
    console.error("Error fetching top customers:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
