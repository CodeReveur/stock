import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

const prisma = new PrismaClient();

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  try {
    const today = new Date();

    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const previousWeekStart = subWeeks(currentWeekStart, 1);
    const previousWeekEnd = subWeeks(currentWeekEnd, 1);

    const [currentWeekPurchases, previousWeekPurchases] = await Promise.all([
      prisma.purchase_orders.findMany({
        where: {
          created_at: {
            gte: currentWeekStart,
            lte: currentWeekEnd,
          },
        },
      }),
      prisma.purchase_orders.findMany({
        where: {
          created_at: {
            gte: previousWeekStart,
            lte: previousWeekEnd,
          },
        },
      }),
    ]);

    const getDailyStock = (purchases: any[]) => {
      const dailyStock: { [key: string]: number } = {};
      for (let i = 0; i < 7; i++) dailyStock[days[i]] = 0;

      for (const purchase of purchases) {
        const day = days[new Date(purchase.created_at).getDay()];
        dailyStock[day] += Number(purchase.stock || 0);
      }

      return dailyStock;
    };

    const currentStock = getDailyStock(currentWeekPurchases);
    const previousStock = getDailyStock(previousWeekPurchases);

    const result = days.map(day => ({
      day,
      previous: previousStock[day],
      current: currentStock[day],
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Weekly purchased_stock analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
