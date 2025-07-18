import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json(); // Extracting the ID from the request body

    await prisma.products.delete({
      where: { id: Number(id) },
    });

    await prisma.purchase_orders.deleteMany({
      where: { product: Number(id), status: "Revoked" },
    });

    const alertMessage = `Product with id :) ${id} has been deleted`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
