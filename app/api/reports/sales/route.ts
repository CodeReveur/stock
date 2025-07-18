import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { writeFile } from "fs/promises";
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

    // Fetch completed orders within range including customer
    const orders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
        status: "Completed",
      },
      include: {
        customerInfo: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Load all products to match by ID
    const products = await prisma.products.findMany();

    const reportRows: any[] = [];
    let totalSales = 0;
    let totalItems = 0;

    for (const order of orders) {
      const productList = JSON.parse(order.product || "[]");

      for (const item of productList) {
        const product = products.find(p => p.id === item.id);
        if (!product) continue;

        const row = {
          invoice: order.invoice,
          customer: order.customerInfo.name,
          email: order.customerInfo.email,
          phone: order.customerInfo.phone,
          product: product.name,
          qty: item.qty,
          unit_price: product.price,
          total_price: product.price * item.qty,
          date: new Date(order.created_at).toLocaleDateString(),
        };

        totalSales += row.total_price;
        totalItems += row.qty;
        reportRows.push(row);
      }
    }

    const jsonData = {
      total_sales: totalSales,
      total_items_sold: totalItems,
      from: from_date,
      to: to_date,
      orders: reportRows,
    };

    const reportFileName = `sales_report_${Date.now()}`;
    const reportPath = join(process.cwd(), "public", "docs");
    await import("fs/promises").then(fs => fs.mkdir(reportPath, { recursive: true }));

    const filePath = join(reportPath, `${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`);

    if (doc_type === "Excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sales Report");

      sheet.addRow(["Sales Report"]);
      sheet.addRow([`From: ${from_date} - To: ${to_date}`]);
      sheet.addRow(["Total Sales", totalSales + " RWF"]);
      sheet.addRow(["Total Items Sold", totalItems]);
      sheet.addRow([]);

      sheet.addRow([
        "Invoice",
        "Customer",
        "Email",
        "Phone",
        "Product",
        "Qty",
        "Unit Price",
        "Total Price",
        "Sale Date"
      ]);

      reportRows.forEach(r => {
        sheet.addRow([
          r.invoice,
          r.customer,
          r.email,
          r.phone,
          r.product,
          r.qty,
          r.unit_price,
          r.total_price,
          r.date,
        ]);
      });

      await workbook.xlsx.writeFile(filePath);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Sales Overview Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`From: ${fromDate.toLocaleDateString()} To: ${toDate.toLocaleDateString()}`, 14, 22);
      doc.text(`Total Sales: ${totalSales} RWF`, 14, 28);
      doc.text(`Total Items Sold: ${totalItems}`, 14, 34);

      autoTable(doc, {
        startY: 42,
        head: [[
          "Invoice", "Customer", "Email", "Phone", "Product", "Qty", "Unit Price", "Total Price", "Date"
        ]],
        body: reportRows.map(r => [
          r.invoice,
          r.customer,
          r.email,
          r.phone,
          r.product,
          r.qty,
          r.unit_price,
          r.total_price,
          r.date,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 0] },
      });

      const buffer = doc.output("arraybuffer");
      await writeFile(filePath, Buffer.from(buffer));
    }

    // Save to reports table
    await prisma.report.create({
      data: {
        type: "Sales Overview Report", // SOR = Sales Order Report
        from_date: fromDate,
        to_date: toDate,
        format: doc_type || "PDF",
        file_url: `/docs/${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`,
        data: jsonData,
      },
    });

    const alertMessage = `New report has been generated successfully`;

    await prisma.notification.create({
      data: {
        type: "System Alert",
        details: alertMessage,
        action: "Unread",
        file_url: `/docs/${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Sales report generated successfully",
      downloadUrl: `/docs/${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`
    });
  } catch (err) {
    console.error("Failed to generate sales report:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
