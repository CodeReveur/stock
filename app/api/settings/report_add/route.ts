import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { low_stock_alert, notify_admin, stamp } = body;

    if (!low_stock_alert) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if(stamp){
      await prisma.settings.update({
      where: { id: 1 },
      data: {
        low_stock_alert: low_stock_alert,
        notify_admin: notify_admin,
      },
      });
   } else {
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        low_stock_alert: low_stock_alert,
        notify_admin: notify_admin,
        stamp_url: "",
      },
      });
   }

    const alertMessage = `Settings update: Report generating: ${low_stock_alert}, suggestions: ${notify_admin}, stamp: ${stamp}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });
    return NextResponse.json({
      success: true,
      message: "App name updated successfully.",
    });

  } catch (err) {
    console.error("Failed to update app_name:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
