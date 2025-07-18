import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { search, startDate, endDate, status } = Object.fromEntries(req.nextUrl.searchParams);
    const whereClause: any = { type: "sales" }; // Fetch only sales orders

    // Date range filter
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    // Filter by account type (title)
    if (status) {
      whereClause.status = status
    }
    // Fetch orders (without relations)
    const orders = await prisma.orders.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_code: true,
        customer: true, // Just fetch customer ID
        product: true, // JSON string of products
        amount: true,
        status: true,
        type: true,
        invoice: true,
        created_at: true,
      },
    });

    // Extract unique customer IDs from orders
    const customerIds = [...new Set(orders.map((order) => order.customer))];

    // Fetch customer details manually
    const customers = await prisma.customers.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        name: true,
        phone: true,
        prefered_payment: true,
      },
    });

    // Convert customers array into a lookup object
    const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

    // Extract unique product IDs from all orders
    const productIds = [
      ...new Set(
        orders
          .flatMap((order) => {
            try {
              return JSON.parse(order.product).map((p: { id: number }) => p.id);
            } catch {
              return [];
            }
          })
      ),
    ];

    // Fetch product details
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // Convert products array into a lookup object
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    // Process orders
    const enrichedOrders = orders.map((order) => {
      let parsedProducts: { id: number; qty: number }[] = [];
      try {
        parsedProducts = JSON.parse(order.product);
      } catch {
        parsedProducts = [];
      }

      return {
        id: order.id,
        order_code: order.order_code,
        invoice: order.invoice,
        status: order.status,
        amount: order.amount,
        created_at: order.created_at.toISOString(),
        customer: customerMap[order.customer] || {
          id: order.customer,
          name: "Unknown",
          phone: "Unknown",
          prefered_payment: "Unknown",
        },
        products: parsedProducts.map((p) => ({
          id: p.id,
          name: productMap[p.id]?.name || "Unknown Product",
          price: productMap[p.id]?.price || 0,
          qty: p.qty,
        })),
      };
    });

    // Apply search filter
    const filteredOrders = enrichedOrders.filter((order) => {
      if (!search) return true;
      const lowerSearch = search.toLowerCase();
      return (
        order.customer?.name?.toLowerCase().includes(lowerSearch) ||
        order.customer?.phone?.toLowerCase().includes(lowerSearch) ||
        order.customer?.prefered_payment?.toLowerCase().includes(lowerSearch) ||
        order.products.some((p) => p.name.toLowerCase().includes(lowerSearch))
      );
    });

    return new Response(JSON.stringify(filteredOrders), { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
