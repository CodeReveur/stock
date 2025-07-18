import { NextResponse } from "next/server";
import { machineIdSync } from "node-machine-id"; // Import node-machine-id
const crypto = require('crypto');

export async function GET() {
  try {   
   // Get the unique machine ID
const rawId = machineIdSync();

// Hash it and take first 8 characters (you can adjust the length)
const deviceId = crypto.createHash('sha256').update(rawId).digest('hex').slice(0, 8);
    return NextResponse.json({
      deviceId,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error", err }, { status: 500 });
  }
}
