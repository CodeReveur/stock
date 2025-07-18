import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { machineIdSync } from "node-machine-id"; // Import node-machine-id
const crypto = require('crypto');

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the unique machine ID
    const rawId = machineIdSync();

    // Hash it and take first 8 characters (you can adjust the length)
    const deviceId = crypto.createHash('sha256').update(rawId).digest('hex').slice(0, 8);
    const access = await prisma.productKey.findUnique({where: { id: "cm9et8sj10002i5q07ag76le2" }});

    if(access?.appId !== deviceId){
      await prisma.productKey.update({where: {id: "cm9et8sj10002i5q07ag76le2" },data: {used: false}});
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch access: "+err }, { status: 500 });
  }
}
 