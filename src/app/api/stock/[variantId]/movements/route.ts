import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { variantId } = await params;
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  const movements = await prisma.stockMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ variant, movements });
}
