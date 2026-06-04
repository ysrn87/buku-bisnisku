import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const keys = ["pointsConversionRate", "minPointsForRedemption", "maxPointsPerTransaction"];
  const settings = await prisma.settings.findMany({ where: { key: { in: keys } } });
  const map: Record<string, number> = { pointsConversionRate: 1000, minPointsForRedemption: 10, maxPointsPerTransaction: 1000 };
  for (const s of settings) map[s.key] = Number(s.value);
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const updates = [
    { key: "pointsConversionRate", value: String(body.pointsConversionRate) },
    { key: "minPointsForRedemption", value: String(body.minPointsForRedemption) },
    { key: "maxPointsPerTransaction", value: String(body.maxPointsPerTransaction) },
  ].filter(u => u.value !== "undefined");
  for (const u of updates) {
    await prisma.settings.upsert({ where: { key: u.key }, create: { key: u.key, value: u.value }, update: { value: u.value } });
  }
  return NextResponse.json({ ok: true });
}
