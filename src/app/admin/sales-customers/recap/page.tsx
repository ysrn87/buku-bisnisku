"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface RecapRow { variantId: string; productName: string; variantName: string; sku: string; totalQty: number; totalRevenue: number; totalTransactions: number; avgPrice: number; }

export default function RecapPage() {
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [summary, setSummary] = useState({ totalTransactions: 0, totalQty: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/reports").then(r => r.json()).then(d => {
      setRows(d.recapRows ?? []);
      setSummary({ totalTransactions: d.totalTransactions ?? 0, totalQty: d.totalQty ?? 0, totalRevenue: d.totalRevenue ?? 0 });
      setLoading(false);
    });
  }, []);

  const filtered = rows.filter(r =>
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.variantName.toLowerCase().includes(search.toLowerCase()) ||
    r.sku.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Rekap Penjualan</h1><p className="page-subtitle">Performa produk berdasarkan penjualan</p></div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Transaksi", value: summary.totalTransactions, format: "num" },
          { label: "Total Unit Terjual", value: summary.totalQty, format: "num" },
          { label: "Total Pendapatan", value: summary.totalRevenue, format: "rp" },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--gray-400)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--teal-600)" }}>{s.format === "rp" ? formatRupiah(s.value) : s.value.toLocaleString("id-ID")}</p>
          </div>
        ))}
      </div>

      <div className="card mb-4 p-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk atau SKU…" className="form-input" />
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Produk</th><th>SKU</th><th>Qty Terjual</th><th>Transaksi</th><th>Rata-rata Harga</th><th>Total Pendapatan</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.variantId}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td>
                      <p className="font-medium text-gray-800">{r.productName}</p>
                      <p className="text-xs text-gray-400">{r.variantName}</p>
                    </td>
                    <td className="text-xs text-gray-400">{r.sku}</td>
                    <td className="font-semibold">{r.totalQty.toLocaleString("id-ID")}</td>
                    <td>{r.totalTransactions}</td>
                    <td>{formatRupiah(r.avgPrice)}</td>
                    <td className="font-bold" style={{ color: "var(--teal-600)" }}>{formatRupiah(r.totalRevenue)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
