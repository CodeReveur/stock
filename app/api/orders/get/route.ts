import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { search, startDate, endDate, status } = Object.fromEntries(req.nextUrl.searchParams);
    const whereClause: any = { type: "import" }; // Fetch only import orders

    // Date range filter
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    // Filter by account type (title)
    if (status) {
      whereClause.status = status
    }
    // Fetch orders (without relations)
    const orders = await prisma.orders.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_code: true,
        supplier: true, // JSON string of supplier
        product: true, // JSON string of products
        amount: true,
        status: true,
        comment: true,
        created_at: true,
      },
    });

    // Extract unique product IDs from all orders
    const productIds = [
      ...new Set(
        orders
          .flatMap((order) => {
            try {
              return JSON.parse(order.product).map((p: { id: number }) => p.id);
            } catch {
              return [];
            }
          })
      ),
    ];

    // Fetch product details
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
      },
    });

    // Create a product map for easy lookup
    const productMap = new Map<number, { id: number; name: string }>();
    products.forEach((product) => {
      productMap.set(product.id, product);
    });

    
    

    // Process orders
    const enrichedOrders = orders.map((order) => {
      let parsedProducts: { id: number; price: number, qty: number }[] = [];
      try {
        parsedProducts = JSON.parse(order.product);
      } catch {
        parsedProducts = [];
      }

      let supplier: { name: string; tin: string; contacts: string } = {
        name: '',
        tin: '',
        contacts: ''
      };
      try {
        supplier = JSON.parse(order.supplier);
      } catch {
        supplier = {
          name: '',
          tin: '',
          contacts: ''
        };
      }

      return {
        id: order.id,
        order_code: order.order_code,
        status: order.status,
        amount: order.amount,
        comment: order.comment,
        created_at: order.created_at.toISOString(),
        supplier: {
          name: supplier.name,
          tin: supplier.tin,
          contacts: supplier.contacts,
        },
        products: parsedProducts.map((p) => ({
          id: p.id,
          name: productMap.get(p.id)?.name || "Unknown Product",
          price: p.price || 0,
          qty: p.qty,
        })),
      };
    });

    // Apply search filter
    const filteredOrders = enrichedOrders.filter((order) => {
      if (!search) return true;
      const lowerSearch = search.toLowerCase();
      return (
        order.supplier?.name?.toLowerCase().includes(lowerSearch) ||
        order.supplier?.tin?.toLowerCase().includes(lowerSearch) ||
        order.supplier?.contacts?.toLowerCase().includes(lowerSearch) ||
        order.comment?.toLowerCase().includes(lowerSearch) ||
        order.products.some((p) => p.name.toLowerCase().includes(lowerSearch))
      );
    });

    return NextResponse.json(filteredOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
