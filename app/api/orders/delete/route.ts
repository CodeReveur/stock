import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json();

    // Step 1: Get the order and parse product array
    const order = await prisma.orders.findUnique({
      where: { id, status: { in: ["Completed", "Shipped"] }, type: "import" },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Parse product field: [{ id: number, qty: number }]
    const products = JSON.parse(order.product);

    // Step 2: For each product, increment its stock
    for (const item of products) {
      await prisma.products.update({
        where: { id: item.id },
        data: {
          stock: {
            decrement: item.qty, // increase back the qty sold
          },
        },
      });
    }

    // Step 3: Delete the order
    await prisma.orders.delete({
      where: { id },
    });

    const alertMessage = `Import order with id :) ${id} has been deleted`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ message: "Import order removed and stock updated" }, { status: 200 });

  } catch (err) {
    console.error("Error revoking order:", err);
    return NextResponse.json({ error: "Failed to revoke order" }, { status: 500 });
  }
}
