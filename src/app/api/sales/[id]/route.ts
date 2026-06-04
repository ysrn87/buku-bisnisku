import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { paymentMethod, paymentStatus, discount, tax, ongkir, notes, items } = body;

  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) return NextResponse.json({ error: "Penjualan tidak ditemukan" }, { status: 404 });

  let subtotal = Number(sale.subtotal);
  if (items && items.length > 0) {
    subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + Number(i.price) * Number(i.quantity), 0);
    await prisma.saleItem.deleteMany({ where: { saleId: id } });
    await prisma.saleItem.createMany({
      data: items.map((i: { variantId: string; quantity: number; price: number }) => ({
        saleId: id, variantId: i.variantId, quantity: Number(i.quantity),
        price: Number(i.price), subtotal: Number(i.price) * Number(i.quantity),
      })),
    });
  }

  const total = subtotal - Number(discount) + Number(tax) + Number(ongkir);
  const updated = await prisma.sale.update({
    where: { id },
    data: { paymentMethod, paymentStatus, discount: Number(discount) || 0, tax: Number(tax) || 0, ongkir: Number(ongkir) || 0, notes: notes || null, subtotal, total },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) return NextResponse.json({ error: "Penjualan tidak ditemukan" }, { status: 404 });

  await prisma.$transaction(async (tx: typeof prisma) => {
    for (const item of sale.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId }, include: { product: true },
      });
      if (variant?.product.type !== "PREORDER") {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        await tx.stockMovement.create({
          data: { variantId: item.variantId, quantity: item.quantity, type: "IN", notes: `Stok dikembalikan dari penghapusan ${sale.saleNumber}` },
        });
      }
    }
    if (sale.customerId) {
      if (sale.pointsEarned > 0) {
        await tx.user.update({ where: { id: sale.customerId }, data: { points: { decrement: sale.pointsEarned } } });
        await tx.pointHistory.create({ data: { userId: sale.customerId, points: -sale.pointsEarned, type: "ADJUSTED", description: `Poin dikembalikan dari penghapusan ${sale.saleNumber}` } });
      }
      if (sale.pointsRedeemed > 0) {
        await tx.user.update({ where: { id: sale.customerId }, data: { points: { increment: sale.pointsRedeemed } } });
        await tx.pointHistory.create({ data: { userId: sale.customerId, points: sale.pointsRedeemed, type: "ADJUSTED", description: `Poin dikembalikan dari penghapusan ${sale.saleNumber}` } });
      }
    }
    await tx.cashflow.create({
      data: { type: "EXPENSE", category: "Penghapusan Penjualan", amount: Number(sale.total), description: `Penghapusan ${sale.saleNumber}`, createdById: session.user.id },
    });
    await tx.sale.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
