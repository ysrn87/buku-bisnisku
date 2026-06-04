"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      identifier: fd.get("identifier"), password: fd.get("password"), redirect: false,
    });
    setLoading(false);
    if (result?.error) { setError("Identitas atau password salah"); return; }
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--teal-100), var(--teal-50), #f0fdfe)" }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-15" style={{ background: "var(--teal-400)", filter: "blur(60px)" }} />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15" style={{ background: "var(--teal-500)", filter: "blur(60px)" }} />

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: "var(--teal-600)" }}>
            <span className="text-3xl">🍳</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--teal-600)" }}>buku-bisnisku</h1>
          <p className="text-gray-500 text-sm mt-1">Login untuk akses ke beranda</p>
        </div>

        {registered && <div className="alert alert-success mb-5">✓ Akun berhasil dibuat. Silakan login.</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email atau No. WhatsApp</label>
            <input name="identifier" type="text" required placeholder="you@example.com atau 08123456789" className="form-input" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input name="password" type={showPw ? "text" : "password"} required placeholder="••••••••" className="form-input pr-10" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2" style={{ padding: "10px" }}>
            {loading ? <><span className="spinner" /> Memproses…</> : <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
              Masuk
            </>}
          </button>
        </form>

        <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400">atau</span></div></div>
        <p className="text-center text-sm text-gray-500">Belum punya akun? <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--teal-600)" }}>Daftar Member</Link></p>
      </div>
    </div>
  );
}
