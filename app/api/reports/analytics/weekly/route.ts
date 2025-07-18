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

    const [currentWeekOrders, previousWeekOrders] = await Promise.all([
      prisma.orders.findMany({
        where: {
          created_at: {
            gte: currentWeekStart,
            lte: currentWeekEnd,
          },
        },
      }),
      prisma.orders.findMany({
        where: {
          status: "Completed",
          created_at: {
            gte: previousWeekStart,
            lte: previousWeekEnd,
          },
        },
      }),
    ]);

    const getDayQuantities = (orders: any[]) => {
      const counts: { [key: string]: number } = {};
      for (let i = 0; i < 7; i++) counts[days[i]] = 0;

      for (const order of orders) {
        const day = days[new Date(order.created_at).getDay()];
        let qtyTotal = 0;

        try {
          const parsedProducts = typeof order.product === "string"
            ? JSON.parse(order.product)
            : order.product;

          if (Array.isArray(parsedProducts)) {
            for (const item of parsedProducts) {
              qtyTotal += Number(item.qty || 0);
            }
          }
        } catch (e) {
          console.warn(`Failed to parse product for order ${order.id}`, e);
        }

        counts[day] += qtyTotal;
      }

      return counts;
    };

    const currentCounts = getDayQuantities(currentWeekOrders);
    const previousCounts = getDayQuantities(previousWeekOrders);

    const result = days.map(day => ({
      day,
      previous: previousCounts[day],
      current: currentCounts[day],
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Weekly analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
