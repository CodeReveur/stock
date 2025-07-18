// app/api/reports/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from_date");
    const to = searchParams.get("to_date");
    const query = searchParams.get("type"); // generalized search term

    const fromDate = from ? new Date(from) : new Date("2000-01-01T00:00:00Z");
    const toDate = to ? new Date(to) : new Date();

    const whereCondition: any = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (query) {
      whereCondition.OR = [
        {
          type: {
            contains: query,
          },
        },
        {
          format: {
            contains: query,
          },
        },
      ];
    }

    const reports = await prisma.report.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
