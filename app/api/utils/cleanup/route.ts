import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const reportsDir = path.join(process.cwd(), "public", "docs");

  try {
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json({ message: "Reports directory not found." }, { status: 404 });
    }

    const files = fs.readdirSync(reportsDir);
    const now = Date.now();
    const deletedFiles: string[] = [];

    files.forEach((file) => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      const ageInMs = now - stats.mtime.getTime();
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

      if (ageInDays > 15) {
        fs.unlinkSync(filePath);
        deletedFiles.push(file);
      }
    });

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: deletedFiles,
      totalDeleted: deletedFiles.length,
    });
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Cleanup failed", detail: err.message }, { status: 500 });
  }
}
