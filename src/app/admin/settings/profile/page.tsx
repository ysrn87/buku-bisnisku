"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Tab = "profile" | "password" | "managers";
interface Manager { id: string; name: string; phone: string; email?: string; address?: string; }
interface UserProfile { id: string; name: string; email?: string; phone: string; address?: string; role: string; points: number; }

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [mgrSuccess, setMgrSuccess] = useState(false);
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const role = session?.user?.role ?? "";

  const load = useCallback(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      setProfile(d.user); setManagers(d.managers ?? []); setLoading(false);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSaving(true); setProfileSuccess(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd)) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 3000); load();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSaving(true); setPwSuccess(false);
    const fd = new FormData(e.currentTarget);
    if (fd.get("newPassword") !== fd.get("confirmPassword")) { setErr("Password baru tidak cocok"); setSaving(false); return; }
    const res = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") }) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setPwSuccess(true); (e.target as HTMLFormElement).reset(); setTimeout(() => setPwSuccess(false), 3000);
  }

  async function addManager(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSaving(true); setMgrSuccess(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/managers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd)) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setMgrSuccess(true); setModal(false); (e.target as HTMLFormElement).reset(); setTimeout(() => setMgrSuccess(false), 3000); load();
  }

  async function delManager(id: string) {
    if (!confirm("Hapus manager ini?")) return;
    await fetch(`/api/managers/${id}`, { method: "DELETE" }); load();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profil" },
    { id: "password", label: "Ubah Password" },
    ...(role === "ADMINISTRATOR" ? [{ id: "managers" as Tab, label: "Kelola Manager" }] : []),
  ];

  if (loading) return <div><div className="page-header"><h1 className="page-title">Profil</h1></div><div className="card p-8 text-center text-gray-400">Memuat…</div></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Profil & Pengaturan</h1><p className="page-subtitle">Kelola akun dan akses</p></div>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setErr(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && profile && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Informasi Profil</h2>
            {err && <div className="alert alert-error">{err}</div>}
            {profileSuccess && <div className="alert alert-success">✓ Profil berhasil diperbarui</div>}
            <form onSubmit={saveProfile} className="space-y-4">
              <div><label className="form-label">Nama Lengkap</label><input name="name" defaultValue={profile.name} className="form-input" /></div>
              <div><label className="form-label">Email</label><input name="email" type="email" defaultValue={profile.email ?? ""} className="form-input" /></div>
              <div><label className="form-label">No. Telepon</label><input name="phone" defaultValue={profile.phone} className="form-input" /></div>
              <div><label className="form-label">Alamat</label><textarea name="address" defaultValue={profile.address ?? ""} className="form-input" rows={2} /></div>
              <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center">
                {saving ? <><span className="spinner" /> Menyimpan…</> : "Simpan Perubahan"}
              </button>
            </form>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Info Akun</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--teal-50)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: "var(--teal-600)" }}>{profile.name[0]}</div>
                <div>
                  <p className="font-semibold text-gray-800">{profile.name}</p>
                  <span className={`badge ${role === "ADMINISTRATOR" ? "badge-teal" : "badge-yellow"}`}>{role}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Telepon</span><span>{profile.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{profile.email ?? "—"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "password" && (
        <div className="card p-6 max-w-md">
          <h2 className="font-semibold text-gray-800 mb-4">Ubah Password</h2>
          {err && <div className="alert alert-error">{err}</div>}
          {pwSuccess && <div className="alert alert-success">✓ Password berhasil diubah</div>}
          <form onSubmit={changePassword} className="space-y-4">
            <div><label className="form-label">Password Saat Ini</label><input name="currentPassword" type="password" required className="form-input" /></div>
            <div><label className="form-label">Password Baru</label><input name="newPassword" type="password" required minLength={6} className="form-input" placeholder="Min. 6 karakter" /></div>
            <div><label className="form-label">Konfirmasi Password Baru</label><input name="confirmPassword" type="password" required minLength={6} className="form-input" /></div>
            <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center">
              {saving ? <><span className="spinner" /> Menyimpan…</> : "Ubah Password"}
            </button>
          </form>
        </div>
      )}

      {tab === "managers" && role === "ADMINISTRATOR" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{managers.length} manager terdaftar</p>
            <button onClick={() => { setModal(true); setErr(""); }} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Manager
            </button>
          </div>
          {mgrSuccess && <div className="alert alert-success mb-4">✓ Manager berhasil ditambahkan</div>}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Nama</th><th>Telepon</th><th>Email</th><th>Alamat</th><th></th></tr></thead>
                <tbody>
                  {managers.map(m => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td>{m.phone}</td>
                      <td className="text-gray-400">{m.email ?? "—"}</td>
                      <td className="text-gray-400 text-xs max-w-xs truncate">{m.address ?? "—"}</td>
                      <td><button onClick={() => delManager(m.id)} className="btn btn-danger btn-sm">Hapus</button></td>
                    </tr>
                  ))}
                  {managers.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Belum ada manager</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {modal && (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
              <div className="modal-box">
                <h2 className="modal-title">Tambah Manager</h2>
                {err && <div className="alert alert-error">{err}</div>}
                <form onSubmit={addManager} className="space-y-3">
                  <div><label className="form-label">Nama *</label><input name="name" required className="form-input" /></div>
                  <div><label className="form-label">No. Telepon *</label><input name="phone" required className="form-input" /></div>
                  <div><label className="form-label">Email</label><input name="email" type="email" className="form-input" /></div>
                  <div><label className="form-label">Alamat</label><textarea name="address" className="form-input" rows={2} /></div>
                  <div><label className="form-label">Password *</label><input name="password" type="password" required minLength={6} className="form-input" placeholder="Min. 6 karakter" /></div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setModal(false)} className="btn btn-secondary flex-1">Batal</button>
                    <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving ? <span className="spinner" /> : "Simpan"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
