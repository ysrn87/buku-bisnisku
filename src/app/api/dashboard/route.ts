import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalVariants, totalSales, totalMembers, totalRevenueAgg, recentSales] = await Promise.all([
    prisma.productVariant.count(),
    prisma.sale.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.sale.findMany({
      include: {
        customer: { select: { name: true } },
        nonMemberCustomer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Low stock: fetch all active variants and filter in JS
  const allActiveVariants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
    orderBy: { stock: "asc" },
  });

  const lowStockItems = allActiveVariants
    .filter((v: { stock: number; lowStock: number }) => v.stock <= v.lowStock)
    .slice(0, 5);

  const lowStockCount = allActiveVariants.filter(
    (v: { stock: number; lowStock: number }) => v.stock <= v.lowStock
  ).length;

  return NextResponse.json({
    totalVariants, totalSales, totalMembers, lowStockCount,
    totalRevenue: Number(totalRevenueAgg._sum.total ?? 0),
    recentSales, lowStockItems,
  });
}
