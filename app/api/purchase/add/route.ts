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
    const { products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products list is required" }, { status: 400 });
    }

    const purchase_code = await generateCode();

    // Prepare data for batch insertion
    const purchaseData = products.map(({ id, price, amount }) => ({
      purchase_code,
      label: "N/A",
      product: id,
      price: parseFloat(price),
      supplier: "N/A",
      status: "Pending",
      stock: parseInt(amount || "0"),
      created_at: new Date(),
      updated_at: new Date(),
    }));

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

