import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse> {
  try {
    const notification = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
    return NextResponse.json(notification, { status: 200 });
    
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories: "+err }, { status: 500 });
  }
}

