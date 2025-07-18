import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

async function generateInvoice(): Promise<string> {
  try {
    const count = (await prisma.orders.count()) + 1;
    const formattedCount = count.toString().padStart(3, "0");
    return `INV${formattedCount}`;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw new Error("Invoice generation failed");
  }
}
async function generateOrderCode(): Promise<string> {
  try {
    const count = (await prisma.orders.count()) + 1;
    const formattedCount = count.toString().padStart(3, "0");
    return `SAL${formattedCount}`;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw new Error("Invoice generation failed");
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { customer, status, products } = await req.json();

    // Validate request
    if (!customer || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch product prices to calculate total amount
    const productIds = products.map((p: { id: number }) => p.id);
    const productData = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    // Calculate total amount
    const totalAmount = products.reduce((sum: number, item: { id: number; price: number; qty: number }) => {
      const product = productData.find((p) => p.id === item.id);
      return sum + (product ? item.price * item.qty : 0);
    }, 0);

    // Generate invoice number
    const invoiceNumber = await generateInvoice();
    const order_code =  await generateOrderCode();
    // Save order
    const order = await prisma.orders.create({
      data: {
        order_code, 
        customer: Number(customer),
        status: status || "Pending",
        amount: totalAmount,
        invoice: invoiceNumber,
        type: "sales", // or "order" based on requirement
        product: JSON.stringify(products),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    
    // Deduct stock for ordered products
    await Promise.all(
      products.map(async (item: { id: number; price: number; qty: number }) => {
        await prisma.products.update({
          where: { id: item.id },
          data: {
            price: item.price,
            stock: {
              decrement: item.qty,
            },
          },
        });
      })
    );
    
    const alertMessage = `New sale has been created with code: ${order_code}, amount: ${totalAmount}, items: ${products.length}, status: ${status}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
        file_url: `/sales`,
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
