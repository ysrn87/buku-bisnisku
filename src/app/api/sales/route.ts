/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSaleNumber, pointsExpiryDate } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sales = await prisma.sale.findMany({
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      nonMemberCustomer: { select: { id: true, name: true, phone: true } },
      cashier: { select: { id: true, name: true } },
      items: { include: { variant: { include: { product: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, customerId, nonMemberCustomerId, paymentMethod, paymentStatus, discount, tax, ongkir, notes, pointsRedeemed } = body;

  if (!items || items.length === 0) return NextResponse.json({ error: "Tidak ada item" }, { status: 400 });
  if (customerId && nonMemberCustomerId) return NextResponse.json({ error: "Pilih salah satu: member atau non-member" }, { status: 400 });
  if (pointsRedeemed > 0 && nonMemberCustomerId) return NextResponse.json({ error: "Penukaran poin hanya untuk member" }, { status: 400 });

  // Validate stock + calculate points
  let pointsEarned = 0;
  const convRate = await getConversionRate();

  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId }, include: { product: true } });
    if (!variant) return NextResponse.json({ error: "Varian produk tidak ditemukan" }, { status: 400 });
    if (variant.product.type !== "PREORDER" && variant.stock < item.quantity) {
      return NextResponse.json({ error: `Stok tidak cukup untuk ${variant.name}` }, { status: 400 });
    }
    if (customerId && !pointsRedeemed && (paymentStatus === "PAID" || !paymentStatus)) {
      pointsEarned += variant.points * item.quantity;
    }
  }

  // Points validation
  if (pointsRedeemed > 0 && customerId) {
    const available = await getAvailablePoints(customerId);
    if (pointsRedeemed > available) return NextResponse.json({ error: `Poin tidak cukup. Tersedia: ${available}` }, { status: 400 });
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of items) subtotal += Number(item.price) * Number(item.quantity);
  const pointDiscount = Number(pointsRedeemed) * convRate;
  const totalDiscount = Number(discount) + pointDiscount;
  if (totalDiscount > subtotal) return NextResponse.json({ error: "Total diskon melebihi subtotal" }, { status: 400 });
  const total = subtotal - Number(discount) - pointDiscount + Number(tax) + Number(ongkir);
  if (total < 0) return NextResponse.json({ error: "Total pembayaran tidak boleh negatif" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sale = await (prisma.$transaction as any)(async (tx: any) => {
    const earnedForSale = customerId && !pointsRedeemed && (paymentStatus === "PAID" || !paymentStatus) ? pointsEarned : 0;
    const redeemedForSale = customerId ? (pointsRedeemed ?? 0) : 0;

    const newSale = await tx.sale.create({
      data: {
        saleNumber: generateSaleNumber(),
        cashierId: session.user!.id!,
        customerId: customerId || null,
        nonMemberCustomerId: nonMemberCustomerId || null,
        subtotal, discount: Number(discount) || 0,
        tax: Number(tax) || 0, ongkir: Number(ongkir) || 0, total,
        paymentMethod, paymentStatus: paymentStatus || "PAID",
        notes: notes || null,
        pointsEarned: earnedForSale, pointsRedeemed: redeemedForSale,
      },
    });

    for (const item of items) {
      await tx.saleItem.create({
        data: { saleId: newSale.id, variantId: item.variantId, quantity: Number(item.quantity), price: Number(item.price), subtotal: Number(item.price) * Number(item.quantity) },
      });
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, include: { product: true } });
      if (variant?.product.type !== "PREORDER") {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: Number(item.quantity) } } });
        await tx.stockMovement.create({ data: { variantId: item.variantId, quantity: -Number(item.quantity), type: "OUT", notes: `PENJUALAN ${newSale.saleNumber}` } });
      }
    }

    if (customerId) {
      if (redeemedForSale > 0) {
        await tx.user.update({ where: { id: customerId }, data: { points: { decrement: redeemedForSale } } });
        await tx.pointHistory.create({ data: { userId: customerId, points: -redeemedForSale, type: "REDEEMED", description: `Penukaran poin ${newSale.saleNumber}` } });
      } else if (earnedForSale > 0) {
        await tx.user.update({ where: { id: customerId }, data: { points: { increment: earnedForSale } } });
        const expiry = pointsExpiryDate(newSale.createdAt);
        await tx.pointHistory.create({ data: { userId: customerId, points: earnedForSale, type: "EARNED", description: `Poin pembelian ${newSale.saleNumber}`, expiresAt: expiry } });
      }
    }

    const cust = customerId ? await tx.user.findUnique({ where: { id: customerId }, select: { name: true } }) : null;
    await tx.cashflow.create({
      data: { type: "INCOME", category: "Penjualan", amount: total, description: `Sale ${newSale.saleNumber} - ${cust?.name ?? "Pelanggan umum"}`, createdById: session.user!.id! },
    });

    return newSale;
  });

  return NextResponse.json(sale);
}

async function getConversionRate(): Promise<number> {
  const s = await prisma.settings.findUnique({ where: { key: "pointsConversionRate" } });
  return s ? Number(s.value) : 1000;
}

async function getAvailablePoints(userId: string): Promise<number> {
  const history = await prisma.pointHistory.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const now = new Date();
  let total = 0;
  for (const entry of history) {
    if (entry.expiresAt && entry.expiresAt < now) continue;
    total += entry.points;
  }
  return Math.max(0, total);
}
