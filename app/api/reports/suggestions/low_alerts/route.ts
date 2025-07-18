import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();

    const allProducts = await prisma.products.findMany();
    const categories = await prisma.categories.findMany();

    const lowStockProducts = await Promise.all(
      allProducts.map(async (product) => {
        // Match the product's category
        const category = categories.find((c) => c.name === product.category);

        if (!category) {
          // No matching category found, skip this product
          return null;
        }

        const stockLimit = category.limit; // Only use limit from category

        if (typeof stockLimit !== "number") {
          // No limit set in category, skip checking
          return null;
        }

        if (product.stock <= stockLimit) {
          const batchMethod = category.batch ?? "FIFO"; // still use batch method if present

          const batches = await prisma.purchase_orders.findMany({
            where: {
              product: product.id,
              stock: { gt: 0 },
              status: "received",
            },
            orderBy: {
              created_at: batchMethod === "FIFO" ? "asc" : "desc",
            },
          });

          const alertMessage = `Low stock alert: "${product.name}" has only ${product.stock} units left (limit: ${stockLimit}). Batch strategy: ${batchMethod}`;

          await prisma.notification.create({
            data: {
              type: "Stock Alert",
              details: alertMessage,
              action: "Unread",
              file_url: '/stock'
            },
          });

          return {
            product_id: product.id,
            product_name: product.name,
            current_stock: product.stock,
            stock_limit: stockLimit,
            batch_method: batchMethod,
            batches: batches.map((b) => ({
              purchase_code: b.purchase_code,
              stock_remaining: b.stock,
              received_at: b.created_at,
            })),
          };
        }

        return null;
      })
    );

    return NextResponse.json({
      success: true,
      message: "Low stock monitoring completed.",
      lowStockProducts: lowStockProducts.filter(p => p !== null),
    });
  } catch (error) {
    console.error("Low stock monitoring error:", error);
    return NextResponse.json(
      { success: false, message: "Error processing low stock monitoring." },
      { status: 500 }
    );
  }
}
