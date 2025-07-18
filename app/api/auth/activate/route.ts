import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { extractDateFromKey } from "../../utils/keyUtils";
import { machineIdSync } from "node-machine-id"; // Import node-machine-id
const crypto = require('crypto');

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { key, appId } = data;
    
    // Get the unique machine ID
    const rawId = machineIdSync();

    // Hash it and take first 8 characters (you can adjust the length)
    const deviceId = crypto.createHash('sha256').update(rawId).digest('hex').slice(0, 8);
    
    const formatKey = (value: string) => {
      // Remove all non-alphanumeric characters
      const cleanedValue = value.replace(/[^A-Za-z0-9]/g, '');
  
      // Split the cleaned value into segments of 4 characters each
      const segments = cleanedValue.match(/.{1,4}/g) || [];
  
      // Join the segments with hyphens
      return segments.join('-').toUpperCase();
    };
    
    const formattedId = formatKey(deviceId);

    if (!key || !appId) {
      return NextResponse.json({ success: false, message: "Key or appId is required" }, { status: 400 });
    }
    
    if(appId !== formattedId) {
      return NextResponse.json({ success: false, message: "App Id is invalid" }, { status: 401 });
    }

    const extractedDate = extractDateFromKey(key);
    if (!extractedDate) {
      return NextResponse.json({ success: false, message: "Invalid key format" }, { status: 400 });
    }

    const record = await prisma.productKey.findUnique({ where: { key } });

    if (!record) {
      return NextResponse.json({ success: false, message: "You entered incorrect key" }, { status: 404 });
    }

    if (new Date() > record.createdAt) {
      return NextResponse.json({ success: false, message: "Key has expired" }, { status: 403 });
    }

    const updatedRecord = await prisma.productKey.update({
      where: { id: record.id },
      data: { used: true },
    });

    if (!updatedRecord) {
      return NextResponse.json({ success: false, message: "Failed to activate key" }, { status: 401 });
    }

   

    return NextResponse.json({
      success: true,
      message: "App activated successfully",
      originalDate: extractedDate.toLocaleDateString("en-GB"),
      expiresAt: record.createdAt,
    });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
