import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { currentPassword, newPassword } = body;
  if (!newPassword || newPassword.length < 6) return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user!.id! } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Password saat ini tidak benar" }, { status: 400 });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.user!.id! }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
