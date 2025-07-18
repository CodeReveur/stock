import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json();

    // Step 1: Get the order and parse product array
    const order = await prisma.orders.findUnique({
      where: { id },
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
            increment: item.qty, // increase back the qty sold
          },
        },
      });
    }

    // Step 3: Delete the order
    await prisma.orders.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sale order removed and stock updated" }, { status: 200 });

  } catch (err) {
    console.error("Error revoking sale:", err);
    return NextResponse.json({ error: "Failed to revoke sale" }, { status: 500 });
  }
}
