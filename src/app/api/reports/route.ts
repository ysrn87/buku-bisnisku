import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [incomeAgg, expenseAgg, salesRevAgg, totalSalesCount, totalProducts, saleItems, variants] = await Promise.all([
    prisma.cashflow.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
    prisma.cashflow.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.sale.count(),
    prisma.productVariant.count(),
    prisma.saleItem.findMany({ include: { variant: { include: { product: true } } } }),
    prisma.productVariant.findMany({ include: { product: true }, orderBy: { stock: "asc" }, take: 200 }),
  ]);

  type RecapRow = { variantId: string; productName: string; variantName: string; sku: string; totalQty: number; totalRevenue: number; totalTransactions: number; avgPrice: number };
  const rowMap: Record<string, RecapRow> = {};
  const saleIdSet = new Set<string>();

  for (const item of saleItems) {
    const v = item.variant;
    if (!rowMap[v.id]) {
      rowMap[v.id] = { variantId: v.id, productName: v.product.name, variantName: v.name, sku: v.sku, totalQty: 0, totalRevenue: 0, totalTransactions: 0, avgPrice: 0 };
    }
    rowMap[v.id].totalQty += item.quantity;
    rowMap[v.id].totalRevenue += Number(item.subtotal);
    rowMap[v.id].totalTransactions++;
    saleIdSet.add(item.saleId);
  }

  const recapRows = Object.values(rowMap).map((r: RecapRow) => ({
    ...r, avgPrice: r.totalQty > 0 ? r.totalRevenue / r.totalQty : 0,
  }));

  const inventoryRows = variants.map((v: { cost: unknown; stock: number; [key: string]: unknown }) => ({
    ...v, stockValue: Number(v.cost) * v.stock,
  }));

  const inventoryValue = inventoryRows.reduce((s: number, v: { stockValue: number }) => s + v.stockValue, 0);

  return NextResponse.json({
    totalIncome: Number(incomeAgg._sum.amount ?? 0),
    totalExpense: Number(expenseAgg._sum.amount ?? 0),
    totalSalesRevenue: Number(salesRevAgg._sum.total ?? 0),
    totalSalesCount, totalProducts, inventoryValue,
    inventory: inventoryRows, recapRows,
    totalTransactions: saleIdSet.size,
    totalQty: recapRows.reduce((s: number, r: RecapRow) => s + r.totalQty, 0),
    totalRevenue: recapRows.reduce((s: number, r: RecapRow) => s + r.totalRevenue, 0),
  });
}
