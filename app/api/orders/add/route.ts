import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * Generates a unique order code.
 *
 * @returns {Promise<string>} A promise that resolves with the generated order code.
 */
async function generateOrderCode(): Promise<string> {
  try {
    const count = (await prisma.orders.count()) + 1;
    const formattedCount = count.toString().padStart(3, "0");
    return `ORD${formattedCount}`;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw new Error("Invoice generation failed");
  }
}

/**
 * Handles the POST request to create a new order.
 *
 * @param {NextRequest} req - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves with the response object.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const {
      supplier_name,
      supplier_tin,
      supplier_contacts,
      comment,
      products,
    } = await req.json();

    // Validate request
    if (
      !supplier_name ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supplier = {
      name: supplier_name,
      tin: supplier_tin,
      contact: supplier_contacts || "N/A",
    };

    // Fetch product prices to calculate total amount
    const productIds = products.map((p: { id: number }) => p.id);
    const productData = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true }, // Select price to calculate total amount
    });

    // Calculate total amount
    const totalAmount = products.reduce((sum: number, item: { id: number; price: number; qty: number }) => {
      const product = productData.find((p) => p.id === item.id);
      return sum + (product ? item.price * item.qty : 0);
    }, 0);

    const orderCode = await generateOrderCode();

    // Save order
    const order = await prisma.orders.create({
      data: {
        order_code: orderCode,
        customer: 2,
        supplier: JSON.stringify(supplier),
        status: "Pending",
        amount: totalAmount,
        invoice: "N/A",
        type: "import", // or "order" based on requirement
        product: JSON.stringify(products),
        comment,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const alertMessage = `New order for import has placed with order code :) ${orderCode} `;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
