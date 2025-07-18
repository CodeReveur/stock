export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    // Get filter values from query parameters
    const search = searchParams.get("search") || undefined;
    const payment = searchParams.get("payment") || undefined;
    const title = searchParams.get("title") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Define filter conditions
    const filters: any = {};

    // Search by phone, name, or email
    if (search) {
      filters.OR = [
        { phone: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { tin: { contains: search } },
      ];
    }

    // Filter by payment method (cash, mobile money, bank transfer)
    if (payment) {
      filters.prefered_payment = payment;
    }

    // Filter by account type (title)
    if (title) {
      filters.title = title;
    }

    // Filter by created_at date range
    if (startDate && endDate) {
      filters.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Step 1: Fetch customers
    const customers = await prisma.customers.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        account: true,
        prefered_payment: true,
        phone: true,
        email: true,
        title: true,
        tin: true,
        created_at: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Step 2: Fetch total sales for each customer
    const customerIds = customers.map((c: { id: any; }) => c.id);
    const salesCounts = await prisma.orders.groupBy({
      by: ["customer"],
      where: { customer: { in: customerIds }, type: "sales" },
      _count: { id: true },
    });

    // Step 3: Merge sales counts with customers
    const formattedCustomers = customers.map((customer: { id: any; }) => {
      const salesData = salesCounts.find((s: { customer: any; }) => s.customer=== customer.id);
      return {
        ...customer,
        total_sales: salesData?._count.id || 0, // Default to 0 if no sales
      };
    });

    return NextResponse.json(formattedCustomers, { status: 200 });
  } catch (err) {
    console.error("Error fetching customer data:", err);
    return NextResponse.json({ error: "Failed to fetch customer data" }, { status: 500 });
  }
}
