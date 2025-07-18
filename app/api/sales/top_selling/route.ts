import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    // 1. Get completed orders
    const orders = await prisma.orders.findMany({
      where: { status: "Completed" },
      select: { product: true },
    });

    // 2. Sum up product quantities sold
    const productSalesMap: Record<number, number> = {};
    for (const order of orders) {
      try {
        const items = JSON.parse(order.product); // [{ id, qty }]
        for (const { id, qty } of items) {
          productSalesMap[id] = (productSalesMap[id] || 0) + qty;
        }
      } catch {
        continue;
      }
    }

    const productIds = Object.keys(productSalesMap).map(Number);

    // 3. Get product info
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        stock: true,
      },
    });

    // 4. Get category batches
    const categoryNames = [...new Set(products.map(p => p.category))];
    const categories = await prisma.categories.findMany({
      where: { name: { in: categoryNames } },
      select: { name: true, batch: true },
    });

    const categoryBatchMap = Object.fromEntries(
      categories.map(c => [c.name, c.batch])
    );

    // 5. Combine and filter + SORT by quantity_sold DESC (TOP)
    const result = products
      .map(p => {
        const sold = productSalesMap[p.id] || 0;
        const stock = p.stock || 0;
        const total = sold + stock;
        const sold_percentage = total > 0 ? Number(((sold / total) * 100).toFixed(2)) : 0;

        const batch = categoryBatchMap[p.category] || "";

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          batch,
          unit: p.unit,
          quantity_sold: sold,
          live_stock: stock,
          sold_percentage,
        };
      })
      .filter(item =>
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.batch.toLowerCase().includes(search)
      )
      .sort((a, b) => b.quantity_sold - a.quantity_sold); // ✅ Top-selling first

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error generating top-selling products:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

