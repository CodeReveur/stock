import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await req.json(); // Extracting the ID from the request body

    await prisma.report.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Report deleted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
