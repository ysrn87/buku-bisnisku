import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";

  const where: Record<string, unknown> = {};
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { sku: { contains: search, mode: "insensitive" } },
  ];

  const products = await prisma.product.findMany({
    where,
    include: { variants: true, createdBy: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = body.name?.trim() ?? "";
  const sku = body.sku?.trim() ?? "";
  if (!name || !sku) return NextResponse.json({ error: "Name dan SKU wajib diisi" }, { status: 400 });

  try {
    const product = await prisma.product.create({
      data: {
        name, sku, type: body.type ?? "READY_STOCK",
        description: body.description || null,
        createdById: session.user!.id!,
      },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "SKU sudah ada atau terjadi kesalahan" }, { status: 400 });
  }
}
