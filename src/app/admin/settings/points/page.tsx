"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";

export default function PointsSettingsPage() {
  const [settings, setSettings] = useState({ pointsConversionRate: 1000, minPointsForRedemption: 10, maxPointsPerTransaction: 1000 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { setSettings(d); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setSuccess(false); setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setSuccess(true); setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) return <div><div className="page-header"><h1 className="page-title">Pengaturan Poin</h1></div><div className="card p-8 text-center text-gray-400">Memuat…</div></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Pengaturan Poin</h1><p className="page-subtitle">Konfigurasi sistem poin loyalitas</p></div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Konfigurasi Poin</h2>
          {err && <div className="alert alert-error">{err}</div>}
          {success && <div className="alert alert-success">✓ Pengaturan berhasil disimpan</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Nilai 1 Poin (Rp)</label>
              <input type="number" min="1" value={settings.pointsConversionRate}
                onChange={e => setSettings(s => ({ ...s, pointsConversionRate: Number(e.target.value) }))}
                className="form-input" />
              <p className="text-xs text-gray-400 mt-1">1 poin = {formatRupiah(settings.pointsConversionRate)}</p>
            </div>
            <div>
              <label className="form-label">Minimum Poin untuk Penukaran</label>
              <input type="number" min="1" value={settings.minPointsForRedemption}
                onChange={e => setSettings(s => ({ ...s, minPointsForRedemption: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div>
              <label className="form-label">Maksimum Poin per Transaksi</label>
              <input type="number" min="1" value={settings.maxPointsPerTransaction}
                onChange={e => setSettings(s => ({ ...s, maxPointsPerTransaction: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center">
              {saving ? <><span className="spinner" /> Menyimpan…</> : "Simpan Pengaturan"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Info Sistem Poin</h2>
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl" style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)" }}>
              <p className="font-semibold mb-1" style={{ color: "var(--teal-600)" }}>🎯 Cara Kerja Poin</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Poin diberikan per unit produk sesuai konfigurasi varian</li>
                <li>• Poin hanya untuk pelanggan member yang sudah login</li>
                <li>• Poin bisa ditukar saat checkout sebagai diskon</li>
                <li>• Poin kadaluarsa di akhir tahun kalender</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "var(--yellow-100)", border: "1px solid #fde68a" }}>
              <p className="font-semibold mb-1" style={{ color: "var(--yellow-600)" }}>⚠️ Catatan</p>
              <p className="text-gray-600">Perubahan nilai konversi hanya berlaku untuk transaksi baru. Poin yang sudah ditukar tidak terpengaruh.</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="font-semibold text-gray-700 mb-2">Pengaturan Aktif</p>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between"><span>Nilai 1 poin</span><span className="font-medium">{formatRupiah(settings.pointsConversionRate)}</span></div>
                <div className="flex justify-between"><span>Min. penukaran</span><span className="font-medium">{settings.minPointsForRedemption} poin</span></div>
                <div className="flex justify-between"><span>Maks. per transaksi</span><span className="font-medium">{settings.maxPointsPerTransaction} poin</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
