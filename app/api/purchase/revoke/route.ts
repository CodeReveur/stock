import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json(); // Extract purchase_code from request

    // Step 1: Update status to "Revoked"
    await prisma.purchase_orders.updateMany({
      where: { purchase_code: id },
      data: { status: "Revoked" },
    });

    // Step 2: Fetch all product IDs and stock amounts from revoked purchases
    const purchasedItems = await prisma.purchase_orders.findMany({
      where: { purchase_code: id },
      select: {
        product: true, // Product ID
        stock: true, // Purchased stock amount
      },
    });

    // Step 3: Reduce stock for each product in 'products' table
    await Promise.all(
      purchasedItems.map(async (item) => {
        await prisma.products.update({
          where: { id: item.product },
          data: { stock: { decrement: item.stock } }, // Reduce stock
        });
      })
    );

    const alertMessage = `Purchase details with id ${id} has been revoked`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ message: "Purchase revoked and stock updated" }, { status: 200 });
  } catch (err) {
    console.error("Error revoking purchase:", err);
    return NextResponse.json({ error: "Failed to revoke purchase" }, { status: 500 });
  }
}

