"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--teal-100), var(--teal-50), #f0fdfe)" }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-15" style={{ background: "var(--teal-400)", filter: "blur(60px)" }} />

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: "var(--teal-600)" }}>
            <span className="text-2xl">🍳</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--teal-600)" }}>Daftar Member</h1>
          <p className="text-gray-500 text-sm mt-1">Buat akun baru sebagai member</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="form-label">Nama Lengkap *</label><input name="name" required className="form-input" placeholder="Nama kamu" /></div>
          <div><label className="form-label">No. WhatsApp *</label><input name="phone" required className="form-input" placeholder="08123456789" /></div>
          <div><label className="form-label">Email</label><input name="email" type="email" className="form-input" placeholder="email@example.com (opsional)" /></div>
          <div><label className="form-label">Alamat *</label><textarea name="address" required className="form-input" rows={2} placeholder="Alamat lengkap" /></div>
          <div><label className="form-label">Tanggal Lahir</label><input name="birthday" type="date" className="form-input" /></div>
          <div><label className="form-label">Password *</label><input name="password" type="password" required minLength={6} className="form-input" placeholder="Min. 6 karakter" /></div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2" style={{ padding: "10px" }}>
            {loading ? <><span className="spinner" /> Mendaftar…</> : "Daftar Sekarang"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">Sudah punya akun? <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--teal-600)" }}>Login</Link></p>
      </div>
    </div>
  );
}
