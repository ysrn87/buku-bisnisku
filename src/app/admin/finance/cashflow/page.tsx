"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";

const INCOME_CATS = ["Penjualan","Modal","Pinjaman","Investasi","Lain-lain"];
const EXPENSE_CATS = ["Pembelian Inventaris","Sewa","Gaji","Utilitas","Pemasaran","Operasional","Penghapusan Penjualan","Lain-lain"];

interface CF { id: string; type: "INCOME" | "EXPENSE"; category: string; amount: number; description: string; date: string; createdBy: { name: string }; }

export default function CashflowPage() {
  const [data, setData] = useState<CF[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [selected, setSelected] = useState<CF | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cfType, setCfType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/cashflow").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(c =>
    (typeFilter === "ALL" || c.type === typeFilter) &&
    (c.description.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
  );

  const totalIncome = data.filter(c => c.type === "INCOME").reduce((s, c) => s + Number(c.amount), 0);
  const totalExpense = data.filter(c => c.type === "EXPENSE").reduce((s, c) => s + Number(c.amount), 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const url = modal === "add" ? "/api/cashflow" : `/api/cashflow/${selected!.id}`;
    const method = modal === "add" ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setModal(null); load();
  }

  async function del(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/cashflow/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Arus Kas</h1><p className="page-subtitle">Pantau pemasukan dan pengeluaran</p></div>
        <button onClick={() => { setModal("add"); setSelected(null); setErr(""); setCfType("INCOME"); }} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card stat-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--gray-400)" }}>Total Pemasukan</p>
          <p className="text-2xl font-bold" style={{ color: "var(--green-600)" }}>{formatRupiah(totalIncome)}</p>
        </div>
        <div className="card stat-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--gray-400)" }}>Total Pengeluaran</p>
          <p className="text-2xl font-bold" style={{ color: "var(--red-500)" }}>{formatRupiah(totalExpense)}</p>
        </div>
        <div className="card stat-card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--gray-400)" }}>Saldo Bersih</p>
          <p className="text-2xl font-bold" style={{ color: totalIncome - totalExpense >= 0 ? "var(--teal-600)" : "var(--red-500)" }}>{formatRupiah(totalIncome - totalExpense)}</p>
        </div>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi…" className="form-input flex-1 min-w-48" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-select w-40">
          <option value="ALL">Semua</option><option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option>
        </select>
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th><th>Dicatat oleh</th><th></th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="text-xs">{formatDate(c.date)}</td>
                    <td><span className={`badge ${c.type === "INCOME" ? "badge-green" : "badge-red"}`}>{c.type === "INCOME" ? "Masuk" : "Keluar"}</span></td>
                    <td className="text-gray-500">{c.category}</td>
                    <td className="max-w-xs truncate">{c.description}</td>
                    <td className={`font-semibold ${c.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                      {c.type === "INCOME" ? "+" : "-"}{formatRupiah(c.amount)}
                    </td>
                    <td className="text-xs text-gray-400">{c.createdBy.name}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(c); setCfType(c.type); setModal("edit"); setErr(""); }} className="btn btn-outline btn-sm">Edit</button>
                        <button onClick={() => del(c.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <h2 className="modal-title">{modal === "add" ? "Tambah" : "Edit"} Transaksi</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div><label className="form-label">Jenis *</label>
                <select name="type" value={cfType} onChange={e => setCfType(e.target.value as "INCOME" | "EXPENSE")} className="form-select">
                  <option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>
              <div><label className="form-label">Kategori *</label>
                <select name="category" defaultValue={selected?.category ?? (cfType === "INCOME" ? "Penjualan" : "Operasional")} className="form-select">
                  {(cfType === "INCOME" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Deskripsi *</label><input name="description" required defaultValue={selected?.description} className="form-input" /></div>
              <div><label className="form-label">Jumlah *</label><input name="amount" type="number" min="1" step="any" required defaultValue={selected ? Number(selected.amount) : ""} className="form-input" /></div>
              <div><label className="form-label">Tanggal *</label><input name="date" type="date" required defaultValue={selected ? new Date(selected.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} className="form-input" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner" /> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
