import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { search, category, batch, supplier, startDate } = Object.fromEntries(req.nextUrl.searchParams);
    
    // Fetch categories with limits
    const categoriesWithLimit = await prisma.categories.findMany({
      where: { limit: { gt: 0 }, batch: batch ? { equals: batch } : undefined },
      select: { name: true, limit: true },
    });

    // Map category limits
    const categoryLimits: Record<string, number> = {};
    categoriesWithLimit.forEach((cat) => {
      categoryLimits[cat.name] = cat.limit;
    });

    // Define filters
    const whereClause: any = {
      category: { in: Object.keys(categoryLimits) }, // Products must belong to categories with limits
    };

    if (search) {
      whereClause.name = { contains: search };
    }
    if (category) {
      whereClause.category = category;
    }
    if (supplier) {
      whereClause.supplier = { contains: supplier};
    }
    if (startDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(),
      };
    }

    // Fetch products matching filters
    const products = await prisma.products.findMany({
      where: whereClause,
      select: {
        name: true,
        stock: true,
        unit: true,
        supplier: true,
        category: true,
        created_at: true,
      },
    });

    // Filter by stock <= category limit
    const lowStockProducts = products.filter(
      (product) => product.stock <= (categoryLimits[product.category] || 0) && product.stock >= (categoryLimits[product.category] || 0)
    );

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error("Error fetching low-stock products:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
