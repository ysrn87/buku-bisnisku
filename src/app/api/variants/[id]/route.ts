import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, sku, price, cost, lowStock, points, isActive } = body;
  if (!name || !sku) return NextResponse.json({ error: "Nama dan SKU wajib diisi" }, { status: 400 });
  const dup = await prisma.productVariant.findFirst({ where: { sku, id: { not: id } } });
  if (dup) return NextResponse.json({ error: "SKU sudah digunakan" }, { status: 400 });
  const variant = await prisma.productVariant.update({
    where: { id },
    data: { name, sku, price: price ?? 0, cost: cost ?? 0, lowStock: lowStock ?? 10, points: points ?? 0, isActive: isActive ?? true },
  });
  return NextResponse.json(variant);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const saleCount = await prisma.saleItem.count({ where: { variantId: id } });
  if (saleCount > 0) return NextResponse.json({ error: "Tidak bisa menghapus varian yang sudah memiliki data penjualan" }, { status: 400 });
  const movCount = await prisma.stockMovement.count({ where: { variantId: id } });
  if (movCount > 0) {
    await prisma.productVariant.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, softDelete: true });
  }
  await prisma.productVariant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
