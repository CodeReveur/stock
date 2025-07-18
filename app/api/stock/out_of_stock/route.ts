import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { search, supplier, startDate, endDate } = Object.fromEntries(req.nextUrl.searchParams);

    // Define filters
    const whereClause: any = {
      stock: 0, // Filter products with zero stock
    };

    if (search) {
      whereClause.name = { contains: search };
    }
    if (supplier) {
      whereClause.supplier = { contains: supplier };
    }
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch out-of-stock products
    const outOfStockProducts = await prisma.products.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        stock: true,
        unit: true,
        supplier: true,
        category: true,
        created_at: true,
      },
    });

    return NextResponse.json(outOfStockProducts);
  } catch (error) {
    console.error("Error fetching out-of-stock products:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
