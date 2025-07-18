import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { name, category, price, unit, supplier, stock } = await req.json();

    if (!name || !category || !price || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    async function generateCode(): Promise<string> {
      try {
        const lastOrder = await prisma.purchase_orders.findFirst({
          orderBy: { id: "desc" },
          select: { id: true },
        });

        const nextId = (lastOrder?.id || 0) + 1;
        const formattedId = nextId.toString().padStart(3, "0");

        return `PUR${formattedId}`;
      } catch (error) {
        console.error("Error generating code:", error);
        throw new Error("Code generation failed");
      }
    }

    const purchase_code = await generateCode();

    const newProduct = await prisma.products.create({
      data: {
        name,
        category,
        price: 0, 
        unit,
        supplier: supplier || "N/A",
        status: "Available",
        stock: parseInt(stock || 0),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.purchase_orders.create({
      data: {
        purchase_code,
        label: "New Stock",
        product: newProduct.id, 
        price: parseFloat(price),
        supplier: supplier || "N/A",
        status: "Active",
        stock: parseInt(stock || 0),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const alertMessage = `New product has been added with purchase code :) ${purchase_code}.\n${newProduct}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
