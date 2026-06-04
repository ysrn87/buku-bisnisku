import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const name = body.name?.trim() ?? "";
  const sku = body.sku?.trim() ?? "";
  if (!name || !sku) return NextResponse.json({ error: "Name dan SKU wajib diisi" }, { status: 400 });

  const existing = await prisma.product.findFirst({ where: { sku, id: { not: id } } });
  if (existing) return NextResponse.json({ error: "SKU sudah digunakan" }, { status: 400 });

  const product = await prisma.product.update({
    where: { id },
    data: { name, sku, type: body.type, description: body.description || null, updatedById: session.user!.id! },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
