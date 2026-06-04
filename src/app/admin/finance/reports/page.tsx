"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface InventoryRow { id: string; name: string; sku: string; stock: number; cost: number; price: number; stockValue: number; product: { name: string }; }

export default function ReportsPage() {
  const [data, setData] = useState<{
    totalIncome: number; totalExpense: number; totalSalesRevenue: number;
    totalSalesCount: number; totalProducts: number; inventoryValue: number;
    inventory: InventoryRow[];
  } | null>(null);
  const [tab, setTab] = useState<"summary" | "inventory">("summary");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div><div className="page-header"><h1 className="page-title">Laporan</h1></div><div className="card p-8 text-center text-gray-400">Memuat…</div></div>;
  if (!data) return null;

  const netProfit = data.totalIncome - data.totalExpense;
  const filtered = (data.inventory ?? []).filter(v =>
    v.product.name.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Laporan</h1><p className="page-subtitle">Ringkasan keuangan dan inventaris</p></div>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {(["summary", "inventory"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "summary" ? "Ringkasan" : "Inventaris"}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Pendapatan", value: data.totalIncome, color: "var(--green-600)" },
              { label: "Total Pengeluaran", value: data.totalExpense, color: "var(--red-500)" },
              { label: "Laba Bersih", value: netProfit, color: netProfit >= 0 ? "var(--teal-600)" : "var(--red-500)" },
              { label: "Pendapatan Penjualan", value: data.totalSalesRevenue, color: "var(--teal-600)" },
              { label: "Total Transaksi", value: data.totalSalesCount, isNum: true, color: "var(--gray-800)" },
              { label: "Nilai Inventaris", value: data.inventoryValue, color: "#7c3aed" },
            ].map(s => (
              <div key={s.label} className="card stat-card">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--gray-400)" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>
                  {s.isNum ? s.value.toLocaleString("id-ID") : formatRupiah(s.value)}
                </p>
              </div>
            ))}
          </div>

          {/* P&L card */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Laporan Laba Rugi</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-600">Pendapatan Penjualan</span>
                <span className="font-semibold text-green-600">{formatRupiah(data.totalSalesRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Pemasukan Lainnya</span>
                <span className="font-semibold text-green-600">{formatRupiah(data.totalIncome - data.totalSalesRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Pengeluaran</span>
                <span className="font-semibold text-red-500">- {formatRupiah(data.totalExpense)}</span>
              </div>
              <div className="flex justify-between font-bold text-base py-3">
                <span>Laba / Rugi Bersih</span>
                <span style={{ color: netProfit >= 0 ? "var(--green-600)" : "var(--red-500)" }}>{formatRupiah(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div>
          <div className="card mb-4 p-4 flex items-center justify-between gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari varian…" className="form-input flex-1 min-w-48" />
            <div className="card stat-card py-2 px-4 border border-purple-100">
              <span className="text-xs text-gray-400">Nilai Inventaris: </span>
              <span className="font-bold text-purple-700">{formatRupiah(data.inventoryValue)}</span>
            </div>
          </div>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>HPP</th><th>Harga Jual</th><th>Nilai Stok</th><th>Potensi Margin</th></tr></thead>
                <tbody>
                  {filtered.map(v => {
                    const margin = Number(v.price) > 0 ? ((Number(v.price) - Number(v.cost)) / Number(v.price) * 100) : 0;
                    return (
                      <tr key={v.id}>
                        <td>
                          <p className="font-medium">{v.product.name}</p>
                          <p className="text-xs text-gray-400">{v.name}</p>
                        </td>
                        <td className="text-xs text-gray-400">{v.sku}</td>
                        <td><span className={`badge ${v.stock <= 0 ? "badge-red" : "badge-green"}`}>{v.stock}</span></td>
                        <td>{formatRupiah(v.cost)}</td>
                        <td>{formatRupiah(v.price)}</td>
                        <td className="font-semibold text-purple-700">{formatRupiah(v.stockValue)}</td>
                        <td>
                          <span className={`badge ${margin >= 30 ? "badge-green" : margin >= 15 ? "badge-yellow" : "badge-red"}`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">Tidak ada data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
