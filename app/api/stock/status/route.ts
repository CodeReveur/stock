import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
// 1. Get all pending orders
const pendingOrders = await prisma.orders.findMany({
  where: { status: "Pending" },
  select: { product: true },
});

// 2. Sum up all qty values from product arrays
let reservedStock = 0;

for (const order of pendingOrders) {
  const products = JSON.parse(order.product); // Array: [{ id, qty }]
  for (const item of products) {
    reservedStock += item.qty;
  }
}


    // Get total pending stock (from pending purchase_orders)
    const pendingStock = await prisma.purchase_orders.aggregate({
      where: { status: "Pending" },
      _sum: { stock: true },
    });
    // Fetch FIFO and LIFO categories
    const fifoCategories = await prisma.categories.findMany({
      where: { batch: "FIFO" },
      select: { name: true },
    });

    const lifoCategories = await prisma.categories.findMany({
      where: { batch: "LIFO" },
      select: { name: true },
    });

    // Extract category names
    const fifoCategoryNames = fifoCategories.map((c) => c.name);
    const lifoCategoryNames = lifoCategories.map((c) => c.name);

    // Sum stock of products where category is in FIFO categories
    const fifoStock = await prisma.products.aggregate({
      where: { category: { in: fifoCategoryNames } },
      _sum: { stock: true },
    });

    // Sum stock of products where category is in LIFO categories
    const lifoStock = await prisma.products.aggregate({
      where: { category: { in: lifoCategoryNames } },
      _sum: { stock: true },
    });

    // Get total stock in the products table
    const totalStock = await prisma.products.aggregate({
      _sum: { stock: true },
    });

    // Calculate live stock = (Total stock in products) - (reserved + pending)
    const liveStock =
      (totalStock._sum.stock || 0) -
      (reservedStock || 0);

    return NextResponse.json({
      reserved_stock: reservedStock || 0,
      pending_stock: pendingStock._sum.stock || 0,
      fifo_stock: fifoStock._sum.stock || 0,
      lifo_stock: lifoStock._sum.stock || 0,
      live_stock: liveStock,
    });
  } catch (error) {
    console.error("Error fetching stock status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
