import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json();

    // Step 1: Get the order and parse product array
    const order = await prisma.orders.update({
      where: { id },
      data: { status: "Completed"}
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const alertMessage = `Sale with details: ${order.order_code} updated`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });

    return NextResponse.json({ message: "Sale order updated" }, { status: 200 });

  } catch (err) {
    console.error("Error revoking sale:", err);
    return NextResponse.json({ error: "Failed to update1 sale" }, { status: 500 });
  }
}
