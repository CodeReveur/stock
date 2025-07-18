import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get total customers
    const total_customers = await prisma.customers.aggregate({
      _count: { id: true },
    });

    // Get total individuals
    const individauls = await prisma.customers.aggregate({
      where: { title: "Individual"},
      _count: { id: true },
    });

    // Gettotal institutions
    const institutions = await prisma.customers.aggregate({
      where: { title: "Institution"},
      _count: { id: true },
    });

    // Sum payments made by customers
    const payments = await prisma.orders.aggregate({
      where: { type: "sales"},
      _sum: { amount: true },
    });

    // Calculate live stock = (Total stock in products) - (reserved + pending)

    return NextResponse.json({
      total_customers: total_customers._count.id || 0,
      payments: payments._sum.amount || 0,
      individauls: individauls._count.id || 0,
      institutions: institutions._count.id || 0,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
