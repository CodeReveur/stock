import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { name, prefered_payment, account, phone, email, title, tin } = await req.json();
   
    if (!name || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCustomer = await prisma.customers.create({
      data: {
        name,
        prefered_payment,
        account: account || "N/A",
        phone: phone || "N/A", 
        email: email || "N/A",
        title,
        tin: tin || "N/A",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    
    const alertMessage = `New customer added. name: ${name} type: ${title}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    
    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: error }, { status: 500 });
  } 
}
