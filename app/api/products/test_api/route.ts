import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse> {
  try {
    const products = await prisma.notification.deleteMany();
    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch products: "+err }, { status: 500 });
  }
}
