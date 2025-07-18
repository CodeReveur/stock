import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse> {
  try {
    const categories = await prisma.productKey.findUnique({where: { id: "cm9et8sj10002i5q07ag76le2" }});
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories: "+err }, { status: 500 });
  }
}

