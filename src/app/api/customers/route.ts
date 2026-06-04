import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizePhone, normalizeEmail } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [members, nonMembers] = await Promise.all([
    prisma.user.findMany({ where: { role: "MEMBER" }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({ members, nonMembers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { type } = body;

  if (type === "member") {
    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const email = normalizeEmail(body.email ?? "");
    const address = body.address?.trim() ?? "";
    const password = body.password ?? "";
    const birthday = body.birthday ?? "";

    if (!name || !phone || !password || !address) return NextResponse.json({ error: "Nama, telepon, password, dan alamat wajib diisi" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });

    const existPhone = await prisma.user.findFirst({ where: { phone } });
    if (existPhone) return NextResponse.json({ error: "Nomor telepon sudah terdaftar" }, { status: 400 });
    if (email) {
      const existEmail = await prisma.user.findFirst({ where: { email } });
      if (existEmail) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, phone, password: hashed, role: "MEMBER", points: 0, email: email || null, address: address || null, birthday: birthday ? new Date(birthday) : null },
    });
    return NextResponse.json(user);
  } else {
    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const address = body.address?.trim() ?? "";
    if (!name || !phone || !address) return NextResponse.json({ error: "Nama, telepon, dan alamat wajib diisi" }, { status: 400 });
    const existUser = await prisma.user.findFirst({ where: { phone } });
    if (existUser) return NextResponse.json({ error: "Nomor telepon sudah terdaftar sebagai member" }, { status: 400 });
    const existCust = await prisma.customer.findFirst({ where: { phone } });
    if (existCust) return NextResponse.json({ error: "Nomor telepon sudah terdaftar" }, { status: 400 });
    const customer = await prisma.customer.create({ data: { name, phone, address: address || null } });
    return NextResponse.json(customer);
  }
}
