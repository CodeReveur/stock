import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    const twentyDaysAgo = subDays(today, 20);

    // Fetch total sales per product for last 20 days
    const salesTrends = await prisma.orders.groupBy({
      by: ["product"],
      _count: { product: true },
      where: {
        created_at: { gte: twentyDaysAgo },
      },
    });

    // Fetch all products
    const allProducts = await prisma.products.findMany({
      select: { name: true },
    });

    // Map product sales
    const salesMap: Record<string, number> = {};
    salesTrends.forEach(trend => {
      salesMap[trend.product] = trend._count.product;
    });

    // Calculate average sales across all sold products
    const totalSales = Object.values(salesMap).reduce((sum, count) => sum + count, 0);
    const avgSales = totalSales / (Object.keys(salesMap).length || 1);

    const trendSuggestions = allProducts.map(product => {
      const productSales = salesMap[product.name] || 0;

      if (productSales === 0) {
        return {
          product: product.name,
          sales_count_last_20_days: 0,
          suggestion: "No sales recorded in last 20 days. Consider promoting or discounting.",
        };
      }

      if (productSales < avgSales * 0.4) { 
        // If product sales are less than 40% of average sales
        return {
          product: product.name,
          sales_count_last_20_days: productSales,
          suggestion: "Sales much lower than average. Consider boosting promotions.",
        };
      }

      // Otherwise, no suggestion needed
      return null;
    }).filter(p => p !== null);

    // Create notification if any trend suggestions exist
    if (trendSuggestions.length > 0) {
      const trendList = trendSuggestions.map(t => t?.product).join(", ");
      await prisma.notification.create({
        data: {
          type: "Trend Alert",
          details: `Products needing attention (20 days trend): ${trendList}`,
          action: "Unread",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "20-day trend monitoring completed.",
      trendSuggestions,
    });
  } catch (error) {
    console.error("Trend monitoring error:", error);
    return NextResponse.json(
      { success: false, message: "Error processing trend monitoring." },
      { status: 500 }
    );
  }
}
