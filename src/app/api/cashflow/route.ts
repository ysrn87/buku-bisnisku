import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cashflows = await prisma.cashflow.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json(cashflows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  const cf = await prisma.cashflow.create({
    data: {
      type: body.type, category: body.category, amount,
      description: body.description, date: body.date ? new Date(body.date) : new Date(),
      createdById: session.user!.id!,
    },
    include: { createdBy: { select: { name: true } } },
  });
  return NextResponse.json(cf);
}
