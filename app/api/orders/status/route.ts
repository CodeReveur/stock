import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    
    //Get total orders
    const totalOrders = await prisma.orders.aggregate({
      where: { type: "import" },
      _count: { id: true },
    });

    // Get total pending orders
    const pendingOrders = await prisma.orders.aggregate({
      where: { status: "Pending", type: "import" },
      _count: { id: true },
    });

    // Fetch shipping
    const shippedOrders = await prisma.orders.aggregate({
      where: { status: "Shipped", type: "import" },
      _count: { id: true },
    });

    // Fetch completed
    const completedOrders = await prisma.orders.aggregate({
      where: { status: "Completed", type: "import" },
      _count: { id: true },
    });

    // Fetch canceled
    const canceledOrders = await prisma.orders.aggregate({
      where: { status: "Canceled", type: "import" },
      _count: { id: true },
    });

    // Fetch shipping
    const rescheduledOrders = await prisma.orders.aggregate({
      where: { status: "Rescheduled", type: "import" },
      _count: { id: true },
    });

    return NextResponse.json({
      totalOrders: totalOrders._count.id || 0,
      pendingOrders: pendingOrders._count.id || 0,
      shippedOrders: shippedOrders._count.id || 0,
      canceledOrders: canceledOrders._count.id || 0,
      completedOrders: completedOrders._count.id || 0,
      rescheduledOrders: rescheduledOrders._count.id,
    });
  } catch (error) {
    console.error("Error fetching stock status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
