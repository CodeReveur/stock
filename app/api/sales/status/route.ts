import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const dateFilter = start && end ? {
      gte: new Date(start),
      lte: new Date(end),
    } : undefined;
    // 1. Revenue (from orders in given period)
    const revenueData = await prisma.orders.aggregate({
      where: {
        status: "Completed",
        ...(dateFilter && { created_at: dateFilter }),
      },
      _sum: { amount: true },
    });
    const total_revenue = revenueData._sum.amount || 0;

    // 2. Sales Count
    const salesData = await prisma.orders.aggregate({
      where: {
        status: "Completed",
        type: "order",
        ...(dateFilter && { created_at: dateFilter }),
      },
      _count: { id: true },
    });
    const total_sales = salesData._count.id;

    // 3. Get all completed orders
    const orders = await prisma.orders.findMany({
      where: {
        status: "Completed",
        ...(dateFilter && { created_at: dateFilter }),
      },
      select: { product: true },
    });

    // Aggregate product sales
    const soldQuantities: { [key: number]: number } = {};
    for (const order of orders) {
      const items = JSON.parse(order.product); // [{id, qty}]
      items.forEach((item: { id: number; price: number; qty: number }) => {
        soldQuantities[item.id] = (soldQuantities[item.id] || 0) + item.qty;
      });
    }

    // 4. Get cost prices from purchase orders
    const purchaseOrders = await prisma.purchase_orders.findMany({
      ...(dateFilter && {
        where: { created_at: dateFilter },
      }),
      select: { product: true, price: true },
    });

    const productCostMap = new Map<number, number>();
    purchaseOrders.forEach(po => {
      productCostMap.set(po.product, po.price); // uses latest found
    });

    // 5. Calculate COGS
    let total_cogs = 0;
    for (const productId in soldQuantities) {
      const qty = soldQuantities[+productId];
      const costPrice = productCostMap.get(+productId) || 0;
      total_cogs += qty * costPrice;
    }

    // 6. Profit, Loss, Margin
    const profit = total_revenue - total_cogs;
    const loss = profit < 0 ? Math.abs(profit) : 0;
    const margin = total_revenue > 0 ? ((profit / total_revenue) * 100).toFixed(2) : "0.00";

    // 7. Closing stock is always current stock
    const closingStockData = await prisma.products.aggregate({
      _sum: { stock: true },
    });
    const closing_stock = closingStockData._sum.stock || 0;

    // Final response
    return NextResponse.json({
      range: dateFilter ? { start, end } : "general",
      total_revenue,
      total_sales,
      total_cogs,
      profit,
      loss,
      margin: `${margin}%`,
      closing_stock,
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
