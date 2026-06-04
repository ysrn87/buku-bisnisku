import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(variants);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { variantId, type, quantity, notes } = body;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) return NextResponse.json({ error: "Varian tidak ditemukan" }, { status: 404 });

  const isPreorder = variant.product.type === "PREORDER";
  let newStock = variant.stock;

  if (!isPreorder) {
    if (type === "IN") newStock += Number(quantity);
    else if (type === "OUT") {
      newStock -= Number(quantity);
      if (newStock < 0) return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
    } else if (type === "ADJUSTMENT") newStock = Number(quantity);
  }

  await prisma.$transaction(async (tx) => {
    if (!isPreorder) {
      await tx.productVariant.update({ where: { id: variantId }, data: { stock: newStock } });
      await tx.stockMovement.create({ data: { variantId, quantity: Number(quantity), type, notes: notes || null } });
    }
    if (!isPreorder && type === "IN" && Number(quantity) > 0) {
      await tx.cashflow.create({
        data: {
          type: "EXPENSE", category: "Pembelian Inventaris",
          amount: Number(variant.cost) * Number(quantity),
          description: `Pembelian ${quantity} unit ${variant.product.name} - ${variant.name}${notes ? ` (${notes})` : ""}`,
          createdById: session.user.id,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
