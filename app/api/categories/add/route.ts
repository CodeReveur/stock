import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { batch, name, low_limit } = await req.json();

    if (!name || !batch || !low_limit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const limit = low_limit || 10;
    const newCategory = await prisma.categories.create({
      data: {
        batch,
        name,
        limit: parseInt(limit),
      },
    });
    const alertMessage = `New category added. name: ${name} limit: ${low_limit} batch: ${batch}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: error }, { status: 500 });
  } 
}
