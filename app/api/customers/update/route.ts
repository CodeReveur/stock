import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { id, name, prefered_payment, account, phone, email, title } = await req.json();
    
    if (!name || !id || !prefered_payment || !phone || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedCustomer = await prisma.customers.update({
      where: { id: Number(id) },
      data: {
        name,
        prefered_payment,
        account: account || "N/A",
        phone,
        email: email || "N/A",
        title,
        updated_at: new Date(),
      },
    });
   
    const alertMessage = `Customer details has been updated successfully. name: ${name} type: ${title} id: ${id}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
