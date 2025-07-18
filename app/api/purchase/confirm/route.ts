import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { purchase_code, label, supplier } = await req.json();

    if (!purchase_code) {
      return NextResponse.json({ error: "purchase_code is required" }, { status: 400 });
    }

    // Check if the purchase order exists
    const existingOrders = await prisma.purchase_orders.findMany({
      where: { purchase_code },
    });

    if (!existingOrders.length) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // Update all records with the same purchase_code
    await prisma.purchase_orders.updateMany({
      where: { purchase_code },
      data: {
        label: label || "N/A",
        supplier: supplier || "N/A",
        status: "Active",
        updated_at: new Date(),
      },
    });

    const products = await prisma.purchase_orders.findMany({
      where: {purchase_code: purchase_code},
      select: {product: true, stock: true},
    })
       // Update stock for existing products
       await Promise.all(
        products.map(async (item) => {
          await prisma.products.update({
            where: { id: item.product },
            data: {
              stock: {
                increment: Number(item.stock) || 0, // Correct stock increment
              },
            },
          });
        })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
