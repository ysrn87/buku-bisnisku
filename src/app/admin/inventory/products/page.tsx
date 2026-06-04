"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";

interface Variant { id: string; name: string; sku: string; price: number; cost: number; stock: number; lowStock: number; points: number; isActive: boolean; }
interface Product { id: string; name: string; sku: string; type: string; isActive: boolean; description?: string; variants: Variant[]; createdBy: { name: string }; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add-product" | "add-variant" | "edit-product" | "edit-variant">(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selVariant, setSelVariant] = useState<Variant | null>(null);
  const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(search)}&status=${status}`).then(r=>r.json()).then(d=>{ setProducts(d); setLoading(false); });
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string, method = "POST") {
    e.preventDefault(); setErr(""); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setModal(null); load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Nonaktifkan produk ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" }); load();
  }
  async function deleteVariant(id: string) {
    if (!confirm("Hapus varian ini?")) return;
    const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    load();
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Produk</h1><p className="page-subtitle">Kelola produk dan varian</p></div>
        <button onClick={()=>{setModal("add-product");setErr("");}} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Tambah Produk
        </button>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk atau SKU…" className="form-input flex-1 min-w-40" />
        <select value={status} onChange={e=>setStatus(e.target.value)} className="form-select w-36">
          <option value="all">Semua</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option>
        </select>
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : products.length === 0 ? <div className="card p-8 text-center text-gray-400">Tidak ada produk</div> : (
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="card">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--teal-600)" }}>{p.name[0]}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">SKU: {p.sku} · {p.type === "PREORDER" ? "Preorder" : "Ready Stock"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>{p.isActive ? "Aktif" : "Nonaktif"}</span>
                  <button onClick={()=>{setSelected(p);setModal("edit-product");setErr("");}} className="btn btn-outline btn-sm">Edit</button>
                  <button onClick={()=>{setSelected(p);setModal("add-variant");setErr("");}} className="btn btn-secondary btn-sm">+ Varian</button>
                  <button onClick={()=>deleteProduct(p.id)} className="btn btn-danger btn-sm">Nonaktifkan</button>
                </div>
              </div>
              {p.variants.length > 0 && (
                <div className="table-wrapper">
                  <table><thead><tr><th>Varian</th><th>SKU</th><th>Harga</th><th>HPP</th><th>Stok</th><th>Poin</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {p.variants.map(v => (
                      <tr key={v.id}>
                        <td className="font-medium">{v.name}</td>
                        <td className="text-gray-400 text-xs">{v.sku}</td>
                        <td>{formatRupiah(v.price)}</td>
                        <td>{formatRupiah(v.cost)}</td>
                        <td><span className={`badge ${v.stock <= v.lowStock ? "badge-red" : "badge-green"}`}>{v.stock}</span></td>
                        <td>{v.points}</td>
                        <td><span className={`badge ${v.isActive ? "badge-teal" : "badge-gray"}`}>{v.isActive ? "Aktif" : "Nonaktif"}</span></td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={()=>{setSelVariant(v);setModal("edit-variant");setErr("");}} className="btn btn-outline btn-sm">Edit</button>
                            <button onClick={()=>deleteVariant(v.id)} className="btn btn-danger btn-sm">Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {modal === "add-product" && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal-box">
            <h2 className="modal-title">Tambah Produk</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={e=>submit(e,"/api/products")} className="space-y-3">
              <div><label className="form-label">Nama *</label><input name="name" required className="form-input" /></div>
              <div><label className="form-label">SKU *</label><input name="sku" required className="form-input" /></div>
              <div><label className="form-label">Deskripsi</label><textarea name="description" className="form-input" rows={2} /></div>
              <div><label className="form-label">Tipe</label>
                <select name="type" className="form-select"><option value="READY_STOCK">Ready Stock</option><option value="PREORDER">Preorder</option></select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner"/> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {modal === "edit-product" && selected && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal-box">
            <h2 className="modal-title">Edit Produk</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={e=>submit(e,`/api/products/${selected.id}`,"PUT")} className="space-y-3">
              <div><label className="form-label">Nama *</label><input name="name" required defaultValue={selected.name} className="form-input" /></div>
              <div><label className="form-label">SKU *</label><input name="sku" required defaultValue={selected.sku} className="form-input" /></div>
              <div><label className="form-label">Deskripsi</label><textarea name="description" defaultValue={selected.description??""} className="form-input" rows={2} /></div>
              <div><label className="form-label">Tipe</label>
                <select name="type" defaultValue={selected.type} className="form-select"><option value="READY_STOCK">Ready Stock</option><option value="PREORDER">Preorder</option></select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner"/> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {modal === "add-variant" && selected && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal-box">
            <h2 className="modal-title">Tambah Varian – {selected.name}</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={async e=>{
              e.preventDefault(); setErr(""); setSubmitting(true);
              const fd = new FormData(e.currentTarget);
              const body = { ...Object.fromEntries(fd), productId: selected.id };
              const res = await fetch("/api/variants",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
              setSubmitting(false);
              if(!res.ok){const d=await res.json();setErr(d.error);return;}
              setModal(null);load();
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Nama Varian *</label><input name="name" required className="form-input" /></div>
                <div><label className="form-label">SKU *</label><input name="sku" required className="form-input" /></div>
                <div><label className="form-label">Harga Jual</label><input name="price" type="number" min="0" step="any" defaultValue="0" className="form-input" /></div>
                <div><label className="form-label">HPP (Harga Pokok)</label><input name="cost" type="number" min="0" step="any" defaultValue="0" className="form-input" /></div>
                <div><label className="form-label">Stok Awal</label><input name="stock" type="number" min="0" defaultValue="0" className="form-input" /></div>
                <div><label className="form-label">Min. Stok</label><input name="lowStock" type="number" min="0" defaultValue="10" className="form-input" /></div>
                <div><label className="form-label">Poin per Unit</label><input name="points" type="number" min="0" defaultValue="0" className="form-input" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner"/> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {modal === "edit-variant" && selVariant && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal-box">
            <h2 className="modal-title">Edit Varian</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={e=>submit(e,`/api/variants/${selVariant.id}`,"PUT")} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Nama *</label><input name="name" required defaultValue={selVariant.name} className="form-input" /></div>
                <div><label className="form-label">SKU *</label><input name="sku" required defaultValue={selVariant.sku} className="form-input" /></div>
                <div><label className="form-label">Harga</label><input name="price" type="number" min="0" step="any" defaultValue={selVariant.price} className="form-input" /></div>
                <div><label className="form-label">HPP</label><input name="cost" type="number" min="0" step="any" defaultValue={selVariant.cost} className="form-input" /></div>
                <div><label className="form-label">Min. Stok</label><input name="lowStock" type="number" min="0" defaultValue={selVariant.lowStock} className="form-input" /></div>
                <div><label className="form-label">Poin</label><input name="points" type="number" min="0" defaultValue={selVariant.points} className="form-input" /></div>
              </div>
              <div><label className="form-label">Status</label>
                <select name="isActive" defaultValue={String(selVariant.isActive)} className="form-select">
                  <option value="true">Aktif</option><option value="false">Nonaktif</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? <span className="spinner"/> : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
