import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  try {
    const formData = await req.formData();
    const app_name = formData.get("app_name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const tin = formData.get("tin") as string;
    const address = formData.get("address") as string;
    const stamp = formData.get("stamp") as File | null;

    if (!app_name || typeof app_name !== "string") {
      return NextResponse.json({ error: "Invalid app_name" }, { status: 400 });
    }

    let stampUrl: string | undefined = undefined;

    if (stamp) {
      const bytes = await stamp.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const stampFileName = `stamp_${Date.now()}_${stamp.name.replace(/\s/g, "_")}`;
      const stampPath = path.join(process.cwd(), "public", "stamp", stampFileName);

      await writeFile(stampPath, buffer);
      stampUrl = `/stamp/${stampFileName}`;
    }

    await prisma.settings.update({
      where: { id: 1 },
      data: {
        contact_email: email,
        contact_phone: phone,
        site_name: app_name,
        tin,
        address,
        stamp_url: stampUrl,
      },
    });

    const alertMessage = `Settings updated: Name: ${app_name}, Phone: ${phone}, Email: ${email}, TIN: ${tin}, Address: ${address}, stamp: ${stamp?.name}`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
      },
    });

    return NextResponse.json({
      success: true,
      message: "App updated successfully.",
    });
  } catch (err) {
    console.error("Failed to update settings:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
