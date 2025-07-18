import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { batch, search, supplier, startDate, endDate } = Object.fromEntries(req.nextUrl.searchParams);

    // Fetch categories that have batch = "FIFO"
    const fifoCategories = await prisma.categories.findMany({
      where: { batch: batch },
      select: { name: true },
    });

    const fifoCategoryNames = fifoCategories.map((cat) => cat.name);

    // Define filters
    const whereClause: any = {
      category: { in: fifoCategoryNames }, // Products must belong to FIFO categories
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

    // Fetch products matching filters
    const fifoProducts = await prisma.products.findMany({
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

    return NextResponse.json(fifoProducts);
  } catch (error) {
    console.error("Error fetching batch products:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
