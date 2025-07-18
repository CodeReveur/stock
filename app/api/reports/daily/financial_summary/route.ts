import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { writeFile } from "fs/promises";
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

export async function GET() {
  try {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setHours(0, 0, 0, 0); // Today at 00:00
    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999); // Today at 23:59

    let doc_type; // You can change to "Excel" if needed
    doc_type = "PDF";
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
    /*
    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: "No financial report today." });
    }
      */

    const products = await prisma.products.findMany();
    const purchaseOrders = await prisma.purchase_orders.findMany();

    const costMap = new Map<number, number>();
    for (const p of purchaseOrders) {
      if (!costMap.has(p.product)) {
        costMap.set(p.product, p.price);
      }
    }

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
    const reportFileName = `daily_growth_${now.toISOString().slice(0, 10)}`;
    const reportPath = join(process.cwd(), "public", "docs");
    await import("fs/promises").then(fs => fs.mkdir(reportPath, { recursive: true }));
    const filePath = join(reportPath, `${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`);
    const downloadUrl = `/docs/${reportFileName}.${doc_type === "Excel" ? "xlsx" : "pdf"}`;

    // Save PDF Report
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Daily Financial Growth Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(now)}`, 14, 22);

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

    // Save to `report` table
    await prisma.report.create({
      data: {
        file_url: downloadUrl,
        type: "Daily Financial Report",
        from_date: fromDate,
        to_date: toDate,
        format: doc_type,
        data: {
          summary: {
            revenue: globalRevenue,
            profit: globalProfit,
            qty: globalQty,
            margin: averageMargin
          },
          rows: financialRows
        }
      }
    });

    // Save to `notification` table
    await prisma.notification.create({
      data: {
        file_url: downloadUrl,
        type: "Daily Financial Growth",
        details: "Today’s financial growth report has been generated.",
        action: "Unread"
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Financial Report Generation Failed:", error);
    return NextResponse.json({ success: false, error });
  }
}
