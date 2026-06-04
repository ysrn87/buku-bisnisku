import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone, normalizeEmail } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { type } = body;

  if (type === "member") {
    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const email = normalizeEmail(body.email ?? "");
    const address = body.address?.trim() ?? "";
    const birthday = body.birthday ?? "";
    if (!name || !phone) return NextResponse.json({ error: "Nama dan telepon wajib diisi" }, { status: 400 });
    const user = await prisma.user.update({
      where: { id },
      data: { name, phone, email: email || null, address: address || null, birthday: birthday ? new Date(birthday) : null },
    });
    return NextResponse.json(user);
  } else {
    const name = body.name?.trim() ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const address = body.address?.trim() ?? "";
    if (!name || !phone) return NextResponse.json({ error: "Nama dan telepon wajib diisi" }, { status: 400 });
    const customer = await prisma.customer.update({ where: { id }, data: { name, phone, address: address || null } });
    return NextResponse.json(customer);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { type } = body;

  if (type === "member") {
    const count = await prisma.sale.count({ where: { customerId: id } });
    if (count > 0) return NextResponse.json({ error: "Tidak bisa menghapus pelanggan yang memiliki data penjualan" }, { status: 400 });
    await prisma.user.deleteMany({ where: { id, role: "MEMBER" } });
  } else {
    const count = await prisma.sale.count({ where: { nonMemberCustomerId: id } });
    if (count > 0) return NextResponse.json({ error: "Tidak bisa menghapus pelanggan yang memiliki data penjualan" }, { status: 400 });
    await prisma.customer.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
