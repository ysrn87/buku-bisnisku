import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productId, name, sku, price, cost, stock, lowStock, points } = body;
  if (!productId || !name || !sku) return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  try {
    const variant = await prisma.productVariant.create({
      data: { productId, name, sku, price: price ?? 0, cost: cost ?? 0, stock: stock ?? 0, lowStock: lowStock ?? 10, points: points ?? 0 },
    });

    // Initial stock movement + cashflow
    if (product.type !== "PREORDER" && stock > 0) {
      await prisma.stockMovement.create({ data: { variantId: variant.id, quantity: stock, type: "IN", notes: "Stok Awal" } });
      await prisma.cashflow.create({
        data: {
          type: "EXPENSE", category: "Pembelian Inventaris",
          amount: Number(cost) * Number(stock),
          description: `Penambahan Stok Awal: ${name} (${sku})`,
          createdById: session.user!.id!,
        },
      });
    }

    return NextResponse.json(variant);
  } catch {
    return NextResponse.json({ error: "SKU sudah ada atau terjadi kesalahan" }, { status: 400 });
  }
}
