import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone, normalizeEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = body.name?.trim() ?? "";
  const phone = normalizePhone(body.phone ?? "");
  const email = normalizeEmail(body.email ?? "");
  const address = body.address?.trim() ?? "";
  const password = body.password ?? "";
  const birthday = body.birthday ?? "";

  if (!name || !phone || !password || !address)
    return NextResponse.json({ error: "Nama, telepon, password, dan alamat wajib diisi" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  if (phone.length < 10 || phone.length > 15)
    return NextResponse.json({ error: "Masukkan nomor telepon yang valid" }, { status: 400 });

  const existingPhone = await prisma.user.findFirst({ where: { phone } });
  if (existingPhone)
    return NextResponse.json({ error: "Nomor telepon sudah terdaftar" }, { status: 400 });

  if (email) {
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail)
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name, phone, password: hashed, role: "MEMBER", points: 0,
      email: email || null, address: address || null,
      birthday: birthday ? new Date(birthday) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
