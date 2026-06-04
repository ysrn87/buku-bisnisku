"use client";
import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";

interface Member { id: string; name: string; phone: string; email?: string; address?: string; birthday?: string; points: number; createdAt: string; }
interface Customer { id: string; name: string; phone: string; address?: string; createdAt: string; }

export default function CustomersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [nonMembers, setNonMembers] = useState<Customer[]>([]);
  const [tab, setTab] = useState<"member" | "nonmember">("member");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [selected, setSelected] = useState<Member | Customer | null>(null);
  const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/customers").then(r => r.json()).then(d => {
      setMembers(d.members ?? []); setNonMembers(d.nonMembers ?? []); setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = tab === "member" ? members : nonMembers;
  const filtered = list.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd), type: tab };
    const url = modal === "add" ? "/api/customers" : `/api/customers/${selected!.id}`;
    const method = modal === "add" ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setModal(null); load();
  }

  async function del(id: string) {
    if (!confirm("Hapus pelanggan ini?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: tab }) });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Pelanggan</h1><p className="page-subtitle">Kelola member dan pelanggan</p></div>
        <button onClick={() => { setModal("add"); setSelected(null); setErr(""); }} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
        {(["member", "nonmember"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "member" ? `Member (${members.length})` : `Non-Member (${nonMembers.length})`}
          </button>
        ))}
      </div>

      <div className="card mb-4 p-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor telepon…" className="form-input" />
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nama</th><th>Telepon</th>
                  {tab === "member" && <><th>Email</th><th>Poin</th><th>Ulang Tahun</th></>}
                  <th>Terdaftar</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-gray-800">{c.name}</td>
                    <td className="text-gray-500">{c.phone}</td>
                    {tab === "member" && (
                      <>
                        <td className="text-gray-400 text-xs">{(c as Member).email ?? "—"}</td>
                        <td><span className="badge badge-teal">{(c as Member).points} poin</span></td>
                        <td className="text-gray-400 text-xs">{(c as Member).birthday ? formatDate((c as Member).birthday!) : "—"}</td>
                      </>
                    )}
                    <td className="text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(c); setModal("edit"); setErr(""); }} className="btn btn-outline btn-sm">Edit</button>
                        <button onClick={() => del(c.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <h2 className="modal-title">{modal === "add" ? "Tambah" : "Edit"} {tab === "member" ? "Member" : "Pelanggan"}</h2>
            {err && <div className="alert alert-error">{err}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div><label className="form-label">Nama *</label><input name="name" required defaultValue={selected?.name} className="form-input" /></div>
              <div><label className="form-label">No. Telepon *</label><input name="phone" required defaultValue={selected?.phone} className="form-input" /></div>
              {tab === "member" && <>
                <div><label className="form-label">Email</label><input name="email" type="email" defaultValue={(selected as Member)?.email ?? ""} className="form-input" /></div>
                <div><label className="form-label">Ulang Tahun</label><input name="birthday" type="date" defaultValue={(selected as Member)?.birthday ? new Date((selected as Member).birthday!).toISOString().split("T")[0] : ""} className="form-input" /></div>
                {modal === "add" && <div><label className="form-label">Password *</label><input name="password" type="password" minLength={6} required className="form-input" placeholder="Min. 6 karakter" /></div>}
              </>}
              <div><label className="form-label">Alamat *</label><textarea name="address" required defaultValue={selected?.address} className="form-input" rows={2} /></div>
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
