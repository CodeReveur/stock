import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from_date, to_date, doc_type } = body;

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    // Get purchase orders in date range
    const purchases = await prisma.purchase_orders.findMany({
      where: {
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { created_at: "asc" },
    });

    if (purchases.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No purchase orders found in selected range.",
      });
    }

    // Get all products for name mapping
    const products = await prisma.products.findMany();

    // Group purchases by product
    const grouped = purchases.reduce((acc, order) => {
      if (!acc[order.product]) {
        acc[order.product] = {
          product_id: order.product,
          product_name: products.find(p => p.id === order.product)?.name || "Unknown Product",
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

    // Define jsonReport here
    const jsonReport = {
      from_date: from_date,
      to_date: to_date,
      total_purchased: totalPurchasedQty,
      total_cost: totalCost,
      products: reportData.map(p => ({
        product_id: p.product_id,
        name: p.product_name,
        total_stock: p.total_stock,
        total_amount: p.total_amount,
      })),
    };

    const fileName = `purchase_summary_${Date.now()}`;
    const filePathBase = join(process.cwd(), "public", "docs");
    await import("fs/promises").then(fs => fs.mkdir(filePathBase, { recursive: true }));
    const fileExt = doc_type === "Excel" ? "xlsx" : "pdf";
    const filePath = join(filePathBase, `${fileName}.${fileExt}`);

    if (doc_type === "Excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Purchase Summary");

      sheet.addRow(["Purchase Summary Report"]);
      sheet.addRow([`From: ${fromDate.toLocaleDateString()}`, `To: ${toDate.toLocaleDateString()}`]);
      sheet.addRow(["Total Purchased", totalPurchasedQty]);
      sheet.addRow(["Total Cost", totalCost + " RWF"]);
      sheet.addRow([]);

      sheet.addRow(["Product ID", "Product Name", "Total Stock", "Total Amount (RWF)"]);
      reportData.forEach(p => {
        sheet.addRow([
          p.product_id,
          p.product_name,
          p.total_stock,
          p.total_amount,
        ]);
      });
      
      await workbook.xlsx.writeFile(filePath);
      
    } else {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Purchase Summary Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`From: ${fromDate.toLocaleDateString()} To: ${toDate.toLocaleDateString()}`, 14, 22);
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
    }

    // Save report metadata to the database
    await prisma.report.create({
      data: {
        type: "Purchase Summary Report",
        from_date: fromDate,
        to_date: toDate,
        format: doc_type || "PDF",
        file_url: `/docs/${fileName}.${fileExt}`, // Ensure the path is correct
        data: jsonReport,
      },
    });

    const alertMessage = `New report has been generated successfully`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
        file_url: `/docs/${fileName}.${fileExt}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      downloadUrl: `/docs/${fileName}.${fileExt}`, // Ensure the path is correct
    });

  } catch (err) {
    console.error("Error generating report:", err);
    return NextResponse.json({ success: false, error: "Report generation failed" }, { status: 500 });
  }
}
