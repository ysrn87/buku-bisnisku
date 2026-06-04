import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizePhone, normalizeEmail } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user!.id! }, select: { id: true, name: true, email: true, phone: true, address: true, role: true, points: true, createdAt: true } });
  const managers = session.user.role === "ADMINISTRATOR"
    ? await prisma.user.findMany({ where: { role: "MANAGER" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, phone: true, address: true } })
    : [];
  return NextResponse.json({ user, managers });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = body.name?.trim() ?? "";
  const phone = normalizePhone(body.phone ?? "");
  const email = normalizeEmail(body.email ?? "");
  const address = body.address?.trim() ?? "";
  if (phone) {
    const existing = await prisma.user.findFirst({ where: { phone, id: { not: session.user!.id! } } });
    if (existing) return NextResponse.json({ error: "Nomor telepon sudah digunakan" }, { status: 400 });
  }
  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, id: { not: session.user!.id! } } });
    if (existing) return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
  }
  const data: Record<string, string | null> = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (email) data.email = email;
  data.address = address || null;
  const user = await prisma.user.update({ where: { id: session.user!.id! }, data });
  return NextResponse.json(user);
}
