import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { writeFile } from "fs/promises";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(now);
  toDate.setHours(23, 59, 59, 999);

  try {
    const orders = await prisma.orders.findMany({
      where: {
        created_at: { gte: fromDate, lte: toDate },
        status: "Completed",
      },
      include: {
        customerInfo: true,
      },
      orderBy: { created_at: "asc" },
    });
    /*
    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: "No purchases today." });
    }
      */
    const products = await prisma.products.findMany();

    const rows = [];
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
        rows.push(row);
      }
    }

    const jsonData = {
      total_sales: totalSales,
      total_items_sold: totalItems,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      orders: rows,
    };

    const doc_type = "PDF";
    const reportFileName = `sales_report_${Date.now()}`;
    const filePath = join(process.cwd(), "public", "docs", `${reportFileName}.pdf`);
    await import("fs/promises").then(fs => fs.mkdir(join(process.cwd(), "public", "reports"), { recursive: true }));

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sales Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`From: ${fromDate.toLocaleDateString()} To: ${toDate.toLocaleDateString()}`, 14, 22);
    doc.text(`Total Sales: ${totalSales} RWF`, 14, 28);
    doc.text(`Total Items Sold: ${totalItems}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [[
        "Invoice", "Customer", "Email", "Phone", "Product", "Qty", "Unit Price", "Total Price", "Date"
      ]],
      body: rows.map(r => [
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

    await writeFile(filePath, Buffer.from(doc.output("arraybuffer")));

    await prisma.report.create({
      data: {
        type: "Sales Overview Report",
        from_date: fromDate,
        to_date: toDate,
        format: doc_type,
        file_url: `/docs/${reportFileName}.pdf`,
        data: jsonData,
      },
    });

     // Save to `notification` table
     await prisma.notification.create({
      data: {
        file_url: `/docs/${reportFileName}.pdf`,
        type: "Sales",
        details: "Today’s sales report has been generated.",
        action: "Unread"
      }
    });

       return NextResponse.json({ success: true, status: 201 });
   
     } catch (error) {
       console.error("Sales Report Generation Failed:", error);
       return NextResponse.json({ success: false, error });
     }
}
