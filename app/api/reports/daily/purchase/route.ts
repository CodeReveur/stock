// lib/report/generatePurchaseSummary.ts
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const now = new Date();
  const fromDate = new Date(now);
  const toDate = new Date(now);

  try {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const purchases = await prisma.purchase_orders.findMany({
      where: {
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { created_at: "asc" },
    });
    /*
    if (purchases.length === 0) {
      return NextResponse.json({ success: false, message: "No purchases today." });
    }
    */
    const products = await prisma.products.findMany();

    const grouped = purchases.reduce((acc, order) => {
      if (!acc[order.product]) {
        acc[order.product] = {
          product_id: order.product,
          product_name: products.find(p => p.id === order.product)?.name || "Unknown",
          total_stock: 0,
          total_amount: 0,
          orders: [],
        };
      }
      acc[order.product].total_stock += order.stock;
      acc[order.product].total_amount += order.stock * order.price;
      acc[order.product].orders.push(order);
      return acc;
    }, {} as Record<number, any>);

    const reportData = Object.values(grouped);
    const totalPurchasedQty = reportData.reduce((sum, r) => sum + r.total_stock, 0);
    const totalCost = reportData.reduce((sum, r) => sum + r.total_amount, 0);

    const jsonReport = {
      from_date: fromDate,
      to_date: toDate,
      total_purchased: totalPurchasedQty,
      total_cost: totalCost,
      products: reportData.map(p => ({
        product_id: p.product_id,
        name: p.product_name,
        total_stock: p.total_stock,
        total_amount: p.total_amount,
      })),
    };

    const fileName = `purchase_summary_${now.toISOString().slice(0, 10)}`;
    const filePathBase = join(process.cwd(), "public", "docs");
    await mkdir(filePathBase, { recursive: true });

    const filePath = join(filePathBase, `${fileName}.pdf`);

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Purchase Summary Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${now.toLocaleDateString()}`, 14, 22);
    doc.text(`Total Purchased: ${totalPurchasedQty}`, 14, 28);
    doc.text(`Total Cost: ${totalCost} RWF`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Product ID", "Name", "Total Stock", "Total Amount (RWF)"]],
      body: reportData.map(p => [
        p.product_id,
        p.product_name,
        p.total_stock,
        p.total_amount,
      ]),
    });

    const pdfBuffer = doc.output("arraybuffer");
    await writeFile(filePath, Buffer.from(pdfBuffer));

    await prisma.report.create({
      data: {
        type: "Purchase Summary Report",
        from_date: fromDate,
        to_date: toDate,
        format: "PDF",
        file_url: `/docs/${fileName}.pdf`,
        data: jsonReport,
      },
    });

    await prisma.notification.create({
      data: {
        file_url: `/docs/${fileName}.pdf`,
        type: "Purchase",
        details: "Today’s purchase report has been generated.",
        action: "Unread",
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Purchase Report Generation Failed:", error);
    return NextResponse.json({ success: false, error });
  }
}
