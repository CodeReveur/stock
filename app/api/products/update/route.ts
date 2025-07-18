import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { id, name, category, price, unit, supplier, stock } = await req.json();
    
    const updatedProduct = await prisma.products.update({
      where: { id: Number(id) },
      data: { name, category, price: Number(price), unit, supplier, stock: Number(stock), updated_at: new Date() },
    });

    const alertMessage = `Product ${name} details has been changed `;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
