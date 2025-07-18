// /app/api/stock/reserved_stock/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date("2000-01-01"); // very old default
    const endDate = new Date(); // today by default
    // 1. Fetch all pending orders within the date range
    const orders = await prisma.orders.findMany({
      where: {
        status: "Pending",
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        order_code: true,
        created_at: true,
        product: true,
        customer: true,
      },
    });

    const productResults: any[] = [];

    for (const order of orders) {
      const customer = await prisma.customers.findUnique({
        where: { id: order.customer },
        select: { name: true, phone: true },
      });

      if (!customer) continue;

      let parsedProducts;
      try {
        parsedProducts = JSON.parse(order.product); // [{id, qty}]
      } catch {
        continue;
      }

      for (const item of parsedProducts) {
        const product = await prisma.products.findUnique({
          where: { id: item.id },
          select: { name: true, category: true, unit: true },
        });

        if (!product) continue;

        const match =
          search === "" ||
          order.order_code.toLowerCase().includes(search) ||
          customer.name.toLowerCase().includes(search) ||
          customer.phone.includes(search) ||
          product.name.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search);

        if (match) {
          productResults.push({
            order_id: order.id,
            order_code: order.order_code,
            created_at: order.created_at,
            customer: {
              name: customer.name,
              phone: customer.phone,
            },
            name: product.name,
            category: product.category,
            unit: product.unit,
            quantity: item.qty,
          });
        }
      }
    }

    return NextResponse.json( productResults , { status: 200 });
  } catch (err) {
    console.error("Error generating reserved stock report:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
