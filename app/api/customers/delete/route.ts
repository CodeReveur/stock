import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json(); // Extracting the ID from the request body

    await prisma.customers.delete({
      where: { id: Number(id) },
    });

    await prisma.orders.deleteMany({
      where: { customer: Number(id)},
    });
   
    const alertMessage = `Customer has been removed with id. ${id}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
