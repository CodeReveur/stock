import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse> {
  try {
    const categories = await prisma.categories.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories: "+err }, { status: 500 });
  }
}

