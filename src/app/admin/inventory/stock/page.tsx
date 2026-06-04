"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";

interface Variant { id: string; name: string; sku: string; stock: number; lowStock: number; price: number; cost: number; isActive: boolean; product: { name: string; type: string }; }

export default function StockPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "adjust" | "movements">(null);
  const [selected, setSelected] = useState<Variant | null>(null);
  const [movements, setMovements] = useState<Array<{ id: string; type: string; quantity: number; notes?: string; createdAt: string }>>([]);
  const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/stock").then(r => r.json()).then(d => { setVariants(d); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = variants.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.product.name.toLowerCase().includes(search.toLowerCase()) ||
    v.sku.toLowerCase().includes(search.toLowerCase())
  );

  async function adjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd), variantId: selected!.id, quantity: Number(fd.get("quantity")) };
    const res = await fetch("/api/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setModal(null); load();
  }

  async function showMovements(v: Variant) {
    setSelected(v); setModal("movements");
    const res = await fetch(`/api/stock/${v.id}/movements`);
    const d = await res.json();
    setMovements(d.movements ?? []);
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Stok</h1><p className="page-subtitle">Pantau dan sesuaikan stok produk</p></div>

      <div className="card mb-4 p-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk atau varian…" className="form-input" />
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>Min. Stok</th><th>Harga</th><th>Nilai Stok</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td>
                      <p className="font-medium text-gray-800">{v.product.name}</p>
                      <p className="text-xs text-gray-400">{v.name}{v.product.type === "PREORDER" && " · Preorder"}</p>
                    </td>
                    <td className="text-xs text-gray-400">{v.sku}</td>
                    <td><span className={`badge ${v.stock <= v.lowStock ? "badge-red" : v.stock <= v.lowStock * 2 ? "badge-yellow" : "badge-green"}`}>{v.stock}</span></td>
                    <td className="text-gray-500">{v.lowStock}</td>
                    <td>{formatRupiah(v.price)}</td>
                    <td className="font-medium">{formatRupiah(Number(v.cost) * v.stock)}</td>
                    <td><span className={`badge ${v.isActive ? "badge-teal" : "badge-gray"}`}>{v.isActive ? "Aktif" : "Nonaktif"}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(v); setModal("adjust"); setErr(""); }} className="btn btn-secondary btn-sm">Sesuaikan</button>
                        <button onClick={() => showMovements(v)} className="btn btn-outline btn-sm">Riwayat</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === "adjust" && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <h2 className="modal-title">Sesuaikan Stok – {selected.product.name} ({selected.name})</h2>
            <p className="text-sm text-gray-500 mb-4">Stok saat ini: <strong>{selected.stock}</strong></p>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={adjust} className="space-y-3">
              <div><label className="form-label">Jenis</label>
                <select name="type" className="form-select">
                  <option value="IN">Masuk (IN)</option>
                  <option value="OUT">Keluar (OUT)</option>
                  <option value="ADJUSTMENT">Koreksi (ADJUSTMENT)</option>
                </select>
              </div>
              <div><label className="form-label">Jumlah</label><input name="quantity" type="number" min="0" required className="form-input" /></div>
              <div><label className="form-label">Catatan</label><input name="notes" className="form-input" placeholder="Opsional" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner" /> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "movements" && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <h2 className="modal-title">Riwayat Stok – {selected.product.name} ({selected.name})</h2>
            {movements.length === 0 ? <p className="text-sm text-gray-400">Belum ada riwayat</p> : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Tanggal</th><th>Jenis</th><th>Jumlah</th><th>Catatan</th></tr></thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id}>
                        <td className="text-xs">{new Date(m.createdAt).toLocaleDateString("id-ID")}</td>
                        <td><span className={`badge ${m.type === "IN" ? "badge-green" : m.type === "OUT" ? "badge-red" : "badge-yellow"}`}>{m.type}</span></td>
                        <td className="font-medium">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="text-xs text-gray-500">{m.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button onClick={() => setModal(null)} className="btn btn-secondary w-full mt-4">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
