"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDateTime } from "@/lib/utils";

interface DashboardData {
  totalVariants: number; totalSales: number; totalMembers: number;
  lowStockCount: number; totalRevenue: number;
  recentSales: Array<{ id: string; saleNumber: string; total: number; paymentMethod: string; createdAt: string; customer?: { name: string }; nonMemberCustomer?: { name: string } }>;
  lowStockItems: Array<{ id: string; name: string; sku: string; stock: number; lowStock: number; product: { name: string } }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div>
      <div className="page-header"><h1 className="page-title">Beranda</h1></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="card stat-card"><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-8 w-16" /></div>)}
      </div>
    </div>
  );

  const stats = [
    { label: "Total Varian", value: data.totalVariants, icon: "📦", color: "var(--teal-600)" },
    { label: "Total Penjualan", value: data.totalSales, icon: "🛒", color: "#7c3aed" },
    { label: "Total Member", value: data.totalMembers, icon: "👥", color: "#d97706" },
    { label: "Stok Rendah", value: data.lowStockCount, icon: "⚠️", color: "var(--red-500)" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Beranda</h1>
        <p className="page-subtitle">Selamat datang kembali 👋</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="card stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-400)" }}>{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card stat-card mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--gray-400)" }}>Total Pendapatan</p>
        <p className="text-3xl font-bold" style={{ color: "var(--teal-600)" }}>{formatRupiah(data.totalRevenue)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Penjualan Terakhir</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentSales.length === 0 ? <p className="p-5 text-sm text-gray-400">Belum ada penjualan</p> :
              data.recentSales.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.saleNumber}</p>
                    <p className="text-xs text-gray-400">{s.customer?.name ?? s.nonMemberCustomer?.name ?? "Umum"} · {formatDateTime(s.createdAt)}</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--teal-600)" }}>{formatRupiah(s.total)}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Stok Rendah</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.lowStockItems.length === 0 ? <p className="p-5 text-sm text-gray-400">Semua stok aman ✓</p> :
              data.lowStockItems.map(v => (
                <div key={v.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.product.name} – {v.name}</p>
                    <p className="text-xs text-gray-400">{v.sku}</p>
                  </div>
                  <span className="badge badge-red">{v.stock} unit</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
