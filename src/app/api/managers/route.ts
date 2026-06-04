import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizePhone, normalizeEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const name = body.name?.trim() ?? "";
  const phone = normalizePhone(body.phone ?? "");
  const email = normalizeEmail(body.email ?? "");
  const address = body.address?.trim() ?? "";
  const password = body.password ?? "";
  if (!name || !phone || password.length < 6) return NextResponse.json({ error: "Nama, telepon, dan password (min 6 karakter) wajib diisi" }, { status: 400 });
  const existing = await prisma.user.findFirst({ where: { phone } });
  if (existing) return NextResponse.json({ error: "Nomor telepon sudah digunakan" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const manager = await prisma.user.create({ data: { name, phone, password: hashed, role: "MANAGER", email: email || null, address: address || null } });
  return NextResponse.json(manager);
}
