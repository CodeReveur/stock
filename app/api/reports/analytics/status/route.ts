import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get total products
    const total_products = await prisma.products.aggregate({
      _count: { id: true },
    });

    // Get total stock
    const stock = await prisma.products.aggregate({
      _sum: { stock: true },
    });

    // Total sales
    const sales = await prisma.orders.aggregate({
      where: { status: "Completed"},
      _sum: { amount: true },
    });

    // Total customers
    const customers = await prisma.customers.aggregate({
      _count: { id: true },
    });
    // Total purchase
    const purchase = await prisma.purchase_orders.aggregate({
      where: { status: "Active"},
      _count: { id: true },
    });

    // Calculate live stock = (Total stock in products) - (reserved + pending)

    return NextResponse.json({
      customers: customers._count.id || 0,
      sales: sales._sum.amount || 0,
      products: total_products._count.id || 0,
      stock: stock._sum.stock || 0,
      purchase: purchase._count.id || 0,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
