import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateCanonicalKeyFromDate } from "../../utils/keyUtils";
import { machineIdSync } from "node-machine-id"; // Import node-machine-id
const crypto = require('crypto');


const prisma = new PrismaClient();

export async function GET() {
  try {   
    const date = new Date();
    const parsedDate = new Date(date);
    const key = generateCanonicalKeyFromDate(parsedDate);
   
    // Get the unique machine ID
   const rawId = machineIdSync();

   // Hash it and take first 8 characters (you can adjust the length)
   const deviceId = crypto.createHash('sha256').update(rawId).digest('hex').slice(0, 8);

    const existing = await prisma.productKey.findUnique({ where: { key } });
    if (existing) {
      await prisma.productKey.update({ where: { id: "cm9et8sj10002i5q07ag76le2" }, data: { appId: deviceId } });
      return NextResponse.json({
        success: true,
        message: "Key already exists",
        key,
        expiresAt: existing.createdAt,
      });
     
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    const newKey = await prisma.productKey.update({ where: { id: "cm9et8sj10002i5q07ag76le2" }, data: { key, createdAt: expiresAt, used: false, appId: deviceId } });
    if (newKey) {
      await prisma.$transaction([
        prisma.products.deleteMany(),
        prisma.orders.deleteMany(),
        prisma.purchase_orders.deleteMany(),
        prisma.customers.deleteMany(),
        prisma.categories.deleteMany(),
        prisma.settings.updateMany({ data: { site_name: "Kamero Stock Management" } }),
        prisma.report.deleteMany(),
        prisma.notification.deleteMany(),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Key generated",
      key,
      deviceId,
      expiresAt,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error", err }, { status: 500 });
  }
}
