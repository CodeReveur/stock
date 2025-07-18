import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { writeFile } from "fs/promises";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const prisma = new PrismaClient();

const formatNumber = (amount: number, decimal: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(amount);
};

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}, ${day} ${year}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from_date, to_date, doc_type } = body;

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    // Fetch orders in the date range with status "Completed"
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

    // Get list of products and purchase orders
    const products = await prisma.products.findMany();
    const purchaseOrders = await prisma.purchase_orders.findMany();

    // Map product purchase costs for later use.
    const costMap = new Map<number, number>();
    for (const p of purchaseOrders) {
      if (!costMap.has(p.product)) {
        costMap.set(p.product, p.price);
      }
    }

    // Build a map of product sales details.
    const productMap = new Map<number, {
      name: string,
      category: string,
      unit_price: number,
      qty_sold: number
    }>();

    for (const order of orders) {
      const productList = JSON.parse(order.product || "[]");

      for (const item of productList) {
        const product = products.find(p => p.id === item.id);
        if (!product) continue;

        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            name: product.name,
            category: product.category,
            unit_price: product.price,
            qty_sold: 0
          });
        }
        productMap.get(product.id)!.qty_sold += item.qty;
      }
    }

    // Prepare financial row data and summary values
    const financialRows: any[] = [];
    let globalRevenue = 0;
    let globalCOGS = 0;
    let globalProfit = 0;
    let globalQty = 0;

    for (const [productId, p] of productMap.entries()) {
      const purchaseCost = costMap.get(productId) || 0;
      const revenue = p.unit_price * p.qty_sold;
      const cogs = purchaseCost * p.qty_sold;
      const profit = revenue - cogs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const total_price = revenue;

      let comment = "";
      if (margin > 40) comment = "High Margin";
      else if (margin > 20) comment = "Good";
      else if (margin >= 0) comment = "Low Margin";
      else comment = "Loss";

      globalRevenue += revenue;
      globalCOGS += cogs;
      globalProfit += profit;
      globalQty += p.qty_sold;

      financialRows.push({
        name: p.name,
        category: p.category,
        qty_sold: p.qty_sold,
        unit_price: p.unit_price,
        total_price,
        revenue,
        cogs,
        profit,
        margin: margin.toFixed(2) + "%",
        comment,
      });
    }

    const averageMargin = globalRevenue > 0 ? (globalProfit / globalRevenue) * 100 : 0;

    // Create filename and determine report file path
    const reportFileName = `financial_growth_${Date.now()}`;
    const reportPath = join(process.cwd(), "public", "docs");
    await import("fs/promises").then(fs => fs.mkdir(reportPath, { recursive: true }));
    const fileExtension = doc_type === "Excel" ? "xlsx" : "pdf";
    const filePath = join(reportPath, `${reportFileName}.${fileExtension}`);

    // Generate report content based on doc_type (Excel or PDF)
    if (doc_type === "Excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Financial Growth");

      // Header
      sheet.addRow(["Financial Growth Report"]);
      sheet.addRow([`From: ${from_date} - To: ${to_date}`]);
      sheet.addRow([]);

      // Global Summary
      sheet.addRow(["Global Summary"]);
      sheet.addRow(["Total Products Sold", globalQty]);
      sheet.addRow(["Total Revenue", globalRevenue]);
      sheet.addRow(["Total COGS", globalCOGS]);
      sheet.addRow(["Total Profit", globalProfit]);
      sheet.addRow(["Average Margin", averageMargin.toFixed(2) + "%"]);
      sheet.addRow([]);

      // Table Headers
      sheet.addRow([
        "Product", "Category", "Qty Sold", "Unit Price",
        "Total Price", "Revenue", "COGS", "Profit", "Margin", "Comment"
      ]);

      // Table Body
      financialRows.forEach(r => {
        sheet.addRow([
          r.name, r.category, r.qty_sold, r.unit_price, r.total_price,
          r.revenue, r.cogs, r.profit, r.margin, r.comment,
        ]);
      });

      await workbook.xlsx.writeFile(filePath);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Financial Growth Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`From: ${formatDate(fromDate)} To: ${formatDate(toDate)}`, 14, 22);

      // Global Summary
      let y = 30;
      const summary = [
        `Total Products Sold: ${formatNumber(globalQty, 0)}`,
        `Total Revenue: ${formatNumber(globalRevenue, 0)} RWF`,
        `Total COGS: ${formatNumber(globalCOGS, 0)} RWF`,
        `Total Profit: ${formatNumber(globalProfit, 0)} RWF`,
        `Average Margin: ${averageMargin.toFixed(2)}%`
      ];
      summary.forEach((line, i) => {
        doc.text(line, 14, y + i * 6);
      });

      y += summary.length * 6 + 4;

      autoTable(doc, {
        startY: y,
        head: [[
          "Product", "Category", "Qty Sold", "Unit Price (RWF)",
          "Total Price (RWF)", "Revenue (RWF)", "COGS (RWF)", "Profit (RWF)", "Margin", "Comment"
        ]],
        body: financialRows.map(r => [
          r.name, r.category, formatNumber(r.qty_sold, 0), formatNumber(r.unit_price, 0), formatNumber(r.total_price, 0),
          formatNumber(r.revenue, 0), formatNumber(r.cogs, 0), formatNumber(r.profit, 0), r.margin, r.comment
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 0] },
      });

      const buffer = doc.output("arraybuffer");
      await writeFile(filePath, Buffer.from(buffer));
    }

    // Prepare the JSON data for the report table.
    const reportData = {
      globalSummary: {
        totalProductsSold: globalQty,
        totalRevenue: globalRevenue,
        totalCOGS: globalCOGS,
        totalProfit: globalProfit,
        averageMargin: averageMargin.toFixed(2) + "%"
      },
      details: financialRows
    };

    // Insert a record into the report table.
    await prisma.report.create({
      data: {
        file_url: `/docs/${reportFileName}.${fileExtension}`,
        type: "Financial Growth Report",
        from_date: fromDate,
        to_date: toDate,
        format: doc_type || "PDF",
        data: reportData
      }
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
      message: "Financial growth report generated successfully",
      downloadUrl: `/docs/${reportFileName}.${fileExtension}`
    });
    
  } catch (err) {
    console.error("Failed to generate financial growth report:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
