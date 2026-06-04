"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { formatRupiah, formatDateTime } from "@/lib/utils";

interface Sale { id: string; saleNumber: string; total: number; paymentMethod: string; paymentStatus: string; pointsEarned: number; pointsRedeemed: number; createdAt: string; items: Array<{ quantity: number; price: number; variant: { name: string; product: { name: string } } }>; }
interface Profile { id: string; name: string; phone: string; email?: string; address?: string; points: number; }

export default function MemberDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => setProfile(d.user));
    fetch("/api/sales").then(r => r.json()).then((all: Sale[]) => {
      const userId = (session?.user as { id?: string })?.id;
      setSales(all.filter(s => (s as { customerId?: string }).customerId === userId).slice(0, 10));
    });
  }, [session]);

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: "var(--teal-600)" }}>
            {profile?.name?.[0] ?? "?"}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{profile?.name}</p>
            <p className="text-sm text-gray-500">{profile?.phone}</p>
            <span className="badge badge-teal text-xs">Member</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: "var(--teal-50)" }}>
            <p className="text-xs text-gray-500 mb-1">Poin Aktif</p>
            <p className="text-2xl font-bold" style={{ color: "var(--teal-600)" }}>{profile?.points ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Nilai Poin</p>
            <p className="text-xl font-bold text-gray-800">{formatRupiah((profile?.points ?? 0) * 1000)}</p>
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Informasi Akun</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{profile?.email ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Alamat</span><span className="text-right max-w-xs">{profile?.address ?? "—"}</span></div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Riwayat Transaksi</h2>
        </div>
        {sales.length === 0 ? (
          <p className="p-5 text-sm text-gray-400 text-center">Belum ada transaksi</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sales.map(s => (
              <div key={s.id} className="px-5 py-3">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-gray-600">{s.saleNumber}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--teal-600)" }}>{formatRupiah(s.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatDateTime(s.createdAt)}</span>
                  <span>
                    {s.pointsEarned > 0 && <span className="text-green-600">+{s.pointsEarned} poin</span>}
                    {s.pointsRedeemed > 0 && <span className="text-red-400 ml-1">-{s.pointsRedeemed} poin</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-outline w-full justify-center" style={{ color: "var(--red-500)", borderColor: "#fecaca" }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Keluar
      </button>
    </div>
  );
}
