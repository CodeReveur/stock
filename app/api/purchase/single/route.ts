import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

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


export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { product, label, stock, price, supplier, amount } = await req.json();


    const purchase_code = await generateCode();

    // Prepare data for batch insertion
    const purchaseData = {
      purchase_code,
      label: label || "N/A",
      product,
      price: parseFloat(price),
      supplier: supplier || "N/A",
      status: "Active",
      stock: parseInt(stock || "0"),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert all products under the same purchase code
    await prisma.purchase_orders.createMany({
      data: purchaseData,
    });

    const alertMessage = `New purchase details has been added :)\n${purchaseData}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ success: true, purchase_code, products: purchaseData }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create purchase orders" }, { status: 500 });
  }
}

