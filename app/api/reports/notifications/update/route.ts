import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {

    const updatedCustomer = await prisma.notification.updateMany({
      data: {
        action: "Read"
      },
    });

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update customer: "+err }, { status: 500 });
  }
}
