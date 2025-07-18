export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract search parameters from the URL
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const supplier = searchParams.get("supplier") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search") || undefined; // Added search term

    // Define filter conditions
    const filters: any = {};

    if (category) filters.category = category;
    if (supplier) filters.supplier = supplier;
    if (status) filters.status = status;

    if (startDate && endDate) {
      filters.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      filters.OR = [
        { name: { contains: search} }, // Search in product names
        { supplier: { contains: search} }, // Search in descriptions
        { unit: { contains: search} },
        { status: { contains: search} }
      ];
    }

    // Fetch filtered products
    const products = await prisma.products.findMany({
      where: filters,
      orderBy: {
        id: "desc",
      },    
    });

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
