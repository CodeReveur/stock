import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { search, startDate, supplier } = Object.fromEntries(req.nextUrl.searchParams);
    const whereClause: any = { status: "Pending" }; // Filter by active status

    // Search filter (matches purchase_code or label)
    if (search) {
      whereClause.OR = [
        { purchase_code: { contains: search } },
      ];
    }

    // Date range filter
    if (startDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(),
      };
    }

    // Supplier filter
    if (supplier) {
      whereClause.supplier = { contains: supplier };
    }

    // Fetch distinct purchase codes
    const distinctPurchases = await prisma.purchase_orders.findMany({
      where: whereClause,
      distinct: ['purchase_code'],
      orderBy: { id: 'desc' }, // Get the latest purchase for each code
      select: {
        id: true,
        purchase_code: true,
        label: true,
        price: true,
        supplier: true,
        status: true,
        created_at: true,
      }
    });

    const enrichedPurchases = await Promise.all(
      distinctPurchases.map(async (purchase) => {
        // Fetch all purchase items under the same purchase_code
        const purchaseItems = await prisma.purchase_orders.findMany({
          where: { purchase_code: purchase.purchase_code },
          select: {
            price: true,  // Purchase price
            stock: true,  // Purchased stock
            product: true // Product ID
          }
        });
    
        // Fetch product details from the products table
        const productIds = purchaseItems.map(item => item.product);
        const productRecords = await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            unit: true,
          }
        });
    
        // Map product details with purchase price and stock
        const productDetails = purchaseItems.map(item => {
          const product = productRecords.find(p => p.id === item.product);
          return {
            id: item.product,
            name: product ? product.name : "Unknown Product", // Add product name
            stock: item.stock, // Purchased stock
            price: item.price,  // Purchase price (not selling price)
            unit: product ? product.unit : "-"
          };
        });
    
        // Calculate total sum(price * stock)
        const totalSum = purchaseItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.stock)), 0);
        const totalStock = purchaseItems.reduce((sum, item) => sum + Number(item.stock), 0);
    
        return {
          id: purchase.id,
          purchase_code: purchase.purchase_code,
          label: purchase.label,
          product: productDetails, // Updated product array with price
          sum: totalSum,
          stock: totalStock,
          supplier: purchase.supplier,
          status: purchase.status,
          created_at: purchase.created_at.toISOString(),
        };
      })
    );
    
    return new Response(JSON.stringify(enrichedPurchases.filter(Boolean)), { status: 200 });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}