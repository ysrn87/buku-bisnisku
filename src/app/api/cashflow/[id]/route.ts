import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  const cf = await prisma.cashflow.update({
    where: { id },
    data: { type: body.type, category: body.category, amount, description: body.description, date: body.date ? new Date(body.date) : new Date() },
    include: { createdBy: { select: { name: true } } },
  });
  return NextResponse.json(cf);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.cashflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
