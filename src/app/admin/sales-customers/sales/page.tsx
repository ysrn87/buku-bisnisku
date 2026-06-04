"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDateTime } from "@/lib/utils";

interface SaleItem { variantId: string; quantity: number; price: number; }
interface Variant { id: string; name: string; sku: string; price: number; stock: number; points: number; product: { name: string; type: string }; }
interface Sale {
  id: string; saleNumber: string; total: number; subtotal: number; discount: number; tax: number; ongkir: number;
  paymentMethod: string; paymentStatus: string; notes?: string; pointsEarned: number; pointsRedeemed: number; createdAt: string;
  customer?: { id: string; name: string; phone: string }; nonMemberCustomer?: { id: string; name: string; phone: string };
  cashier: { name: string };
  items: Array<{ id: string; quantity: number; price: number; subtotal: number; variant: { name: string; sku: string; product: { name: string } } }>;
}
interface Member { id: string; name: string; phone: string; points: number; }
interface Customer { id: string; name: string; phone: string; }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "new" | "view">(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [nonMembers, setNonMembers] = useState<Customer[]>([]);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customerType, setCustomerType] = useState<"none" | "member" | "nonmember">("none");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [discount, setDiscount] = useState(0); const [tax, setTax] = useState(0); const [ongkir, setOngkir] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH"); const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [notes, setNotes] = useState(""); const [settings, setSettings] = useState({ pointsConversionRate: 1000 });
  const [err, setErr] = useState(""); const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/sales").then(r => r.json()).then(d => { setSales(d); setLoading(false); });
  }, []);

  useEffect(() => {
    load();
    fetch("/api/stock").then(r => r.json()).then(setVariants);
    fetch("/api/customers").then(r => r.json()).then(d => { setMembers(d.members ?? []); setNonMembers(d.nonMembers ?? []); });
    fetch("/api/settings").then(r => r.json()).then(setSettings);
  }, [load]);

  const addItem = (v: Variant) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.variantId === v.id);
      if (ex) return prev.map(i => i.variantId === v.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { variantId: v.id, quantity: 1, price: Number(v.price) }];
    });
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const pointDiscount = pointsRedeemed * settings.pointsConversionRate;
  const total = subtotal - discount - pointDiscount + tax + ongkir;
  const selectedMember = members.find(m => m.id === selectedCustomerId);

  async function submitSale() {
    setErr(""); setSubmitting(true);
    const body = {
      items: cartItems, paymentMethod, paymentStatus, discount, tax, ongkir, notes: notes || undefined, pointsRedeemed,
      customerId: customerType === "member" ? selectedCustomerId || undefined : undefined,
      nonMemberCustomerId: customerType === "nonmember" ? selectedCustomerId || undefined : undefined,
    };
    const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error); return; }
    setModal(null); resetForm(); load();
  }

  function resetForm() {
    setCartItems([]); setCustomerType("none"); setSelectedCustomerId(""); setPointsRedeemed(0);
    setDiscount(0); setTax(0); setOngkir(0); setPaymentMethod("CASH"); setPaymentStatus("PAID"); setNotes("");
  }

  async function deleteSale(id: string) {
    if (!confirm("Hapus penjualan ini? Stok akan dikembalikan.")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" }); load();
  }

  const filteredSales = sales.filter(s =>
    s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer?.name ?? s.nonMemberCustomer?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Penjualan</h1><p className="page-subtitle">Catat dan kelola transaksi</p></div>
        <button onClick={() => { setModal("new"); setErr(""); resetForm(); }} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Penjualan Baru
        </button>
      </div>

      <div className="card mb-4 p-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. transaksi atau nama pelanggan…" className="form-input" />
      </div>

      {loading ? <div className="card p-8 text-center text-gray-400">Memuat…</div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>No. Transaksi</th><th>Pelanggan</th><th>Kasir</th><th>Total</th><th>Metode</th><th>Status</th><th>Waktu</th><th></th></tr></thead>
              <tbody>
                {filteredSales.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-semibold">{s.saleNumber}</td>
                    <td>{s.customer?.name ?? s.nonMemberCustomer?.name ?? <span className="text-gray-400">Umum</span>}</td>
                    <td className="text-gray-500">{s.cashier.name}</td>
                    <td className="font-semibold" style={{ color: "var(--teal-600)" }}>{formatRupiah(s.total)}</td>
                    <td><span className="badge badge-teal">{s.paymentMethod}</span></td>
                    <td><span className={`badge ${s.paymentStatus === "PAID" ? "badge-green" : s.paymentStatus === "PENDING" ? "badge-yellow" : "badge-red"}`}>{s.paymentStatus}</span></td>
                    <td className="text-xs text-gray-400">{formatDateTime(s.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setViewSale(s); setModal("view"); }} className="btn btn-outline btn-sm">Detail</button>
                        <button onClick={() => deleteSale(s.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {modal === "new" && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setModal(null); resetForm(); } }}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <h2 className="modal-title">Penjualan Baru</h2>
            {err && <div className="alert alert-error">{err}</div>}

            <div className="grid grid-cols-2 gap-4">
              {/* Left: product picker */}
              <div>
                <p className="form-label mb-2">Pilih Produk</p>
                <input placeholder="Cari varian…" className="form-input mb-2 text-sm" onChange={e => {
                  const q = e.target.value.toLowerCase();
                  setVariants(prev => prev.map(v => ({ ...v, _hidden: !v.name.toLowerCase().includes(q) && !v.product.name.toLowerCase().includes(q) } as Variant)));
                }} />
                <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-52">
                  {variants.filter(v => v.product.type !== "PREORDER" ? v.stock > 0 : true).map(v => (
                    <button key={v.id} type="button" onClick={() => addItem(v)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{v.product.name} – {v.name}</p>
                        <p className="text-xs text-gray-400">{formatRupiah(v.price)} · Stok: {v.stock}</p>
                      </div>
                      <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: cart */}
              <div>
                <p className="form-label mb-2">Keranjang ({cartItems.length} item)</p>
                <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-52 mb-3">
                  {cartItems.length === 0 ? <p className="p-4 text-sm text-gray-400 text-center">Pilih produk di sebelah kiri</p> :
                    cartItems.map(item => {
                      const v = variants.find(x => x.id === item.variantId);
                      return (
                        <div key={item.variantId} className="px-3 py-2 border-b border-gray-50 last:border-0 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{v?.product.name} – {v?.name}</p>
                            <input type="number" min={1} max={v?.product.type !== "PREORDER" ? v?.stock : undefined} value={item.quantity}
                              onChange={e => setCartItems(prev => prev.map(i => i.variantId === item.variantId ? { ...i, quantity: Number(e.target.value) || 1 } : i))}
                              className="form-input text-xs" style={{ padding: "4px 8px", width: 60 }} />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold">{formatRupiah(item.price * item.quantity)}</p>
                            <button onClick={() => setCartItems(prev => prev.filter(i => i.variantId !== item.variantId))} className="text-xs text-red-400 hover:text-red-600">✕</button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label className="form-label">Pelanggan</label>
                <select value={customerType} onChange={e => { setCustomerType(e.target.value as "none" | "member" | "nonmember"); setSelectedCustomerId(""); setPointsRedeemed(0); }} className="form-select">
                  <option value="none">Umum</option><option value="member">Member</option><option value="nonmember">Non-Member</option>
                </select>
              </div>
              {customerType !== "none" && (
                <div className="col-span-2"><label className="form-label">Pilih {customerType === "member" ? "Member" : "Pelanggan"}</label>
                  <select value={selectedCustomerId} onChange={e => { setSelectedCustomerId(e.target.value); setPointsRedeemed(0); }} className="form-select">
                    <option value="">— Pilih —</option>
                    {(customerType === "member" ? members : nonMembers).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone}){customerType === "member" && (c as Member).points ? ` · ${(c as Member).points} poin` : ""}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Points redeem */}
            {customerType === "member" && selectedCustomerId && selectedMember && selectedMember.points > 0 && (
              <div className="mt-3">
                <label className="form-label">Tukar Poin (maks. {selectedMember.points})</label>
                <input type="number" min={0} max={selectedMember.points} value={pointsRedeemed}
                  onChange={e => setPointsRedeemed(Math.min(Number(e.target.value), selectedMember!.points))} className="form-input" />
                <p className="text-xs text-gray-400 mt-1">1 poin = {formatRupiah(settings.pointsConversionRate)} · Diskon: {formatRupiah(pointsRedeemed * settings.pointsConversionRate)}</p>
              </div>
            )}

            {/* Price adjustments */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label className="form-label">Diskon</label><input type="number" min={0} value={discount} onChange={e => setDiscount(Number(e.target.value))} className="form-input" /></div>
              <div><label className="form-label">Pajak</label><input type="number" min={0} value={tax} onChange={e => setTax(Number(e.target.value))} className="form-input" /></div>
              <div><label className="form-label">Ongkir</label><input type="number" min={0} value={ongkir} onChange={e => setOngkir(Number(e.target.value))} className="form-input" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="form-label">Metode Bayar</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-select">
                  <option value="CASH">Tunai</option><option value="TRANSFER">Transfer</option><option value="QRIS">QRIS</option><option value="DEBIT">Debit</option><option value="KREDIT">Kredit</option>
                </select>
              </div>
              <div><label className="form-label">Status Bayar</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="form-select">
                  <option value="PAID">Lunas</option><option value="PENDING">Cicilan</option><option value="UNPAID">Belum Bayar</option>
                </select>
              </div>
            </div>

            <div className="mt-3"><label className="form-label">Catatan</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows={2} /></div>

            {/* Summary */}
            <div className="mt-4 p-4 rounded-xl border border-gray-100" style={{ background: "var(--teal-50)" }}>
              <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm mb-1 text-red-500"><span>Diskon</span><span>- {formatRupiah(discount)}</span></div>}
              {pointDiscount > 0 && <div className="flex justify-between text-sm mb-1 text-red-500"><span>Poin ({pointsRedeemed}x)</span><span>- {formatRupiah(pointDiscount)}</span></div>}
              {tax > 0 && <div className="flex justify-between text-sm mb-1"><span>Pajak</span><span>+ {formatRupiah(tax)}</span></div>}
              {ongkir > 0 && <div className="flex justify-between text-sm mb-1"><span>Ongkir</span><span>+ {formatRupiah(ongkir)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>TOTAL</span><span style={{ color: "var(--teal-600)" }}>{formatRupiah(total)}</span></div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => { setModal(null); resetForm(); }} className="btn btn-secondary flex-1">Batal</button>
              <button type="button" onClick={submitSale} disabled={submitting || cartItems.length === 0 || total < 0} className="btn btn-primary flex-1">
                {submitting ? <span className="spinner" /> : "Simpan Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Sale Modal */}
      {modal === "view" && viewSale && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <h2 className="modal-title">Detail Penjualan</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">No. Transaksi</span><span className="font-mono font-semibold">{viewSale.saleNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Waktu</span><span>{formatDateTime(viewSale.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Kasir</span><span>{viewSale.cashier.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pelanggan</span><span>{viewSale.customer?.name ?? viewSale.nonMemberCustomer?.name ?? "Umum"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Metode Bayar</span><span>{viewSale.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`badge ${viewSale.paymentStatus === "PAID" ? "badge-green" : "badge-yellow"}`}>{viewSale.paymentStatus}</span></div>
            </div>

            <div className="border rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm"><thead><tr><th className="text-left p-2 bg-gray-50">Produk</th><th className="text-right p-2 bg-gray-50">Qty</th><th className="text-right p-2 bg-gray-50">Harga</th><th className="text-right p-2 bg-gray-50">Subtotal</th></tr></thead>
                <tbody>
                  {viewSale.items.map(item => (
                    <tr key={item.id} className="border-t border-gray-50">
                      <td className="p-2">{item.variant.product.name} – {item.variant.name}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{formatRupiah(item.price)}</td>
                      <td className="p-2 text-right font-medium">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(viewSale.subtotal)}</span></div>
              {Number(viewSale.discount) > 0 && <div className="flex justify-between text-red-500"><span>Diskon</span><span>- {formatRupiah(viewSale.discount)}</span></div>}
              {Number(viewSale.tax) > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(viewSale.tax)}</span></div>}
              {Number(viewSale.ongkir) > 0 && <div className="flex justify-between"><span>Ongkir</span><span>{formatRupiah(viewSale.ongkir)}</span></div>}
              {viewSale.pointsRedeemed > 0 && <div className="flex justify-between text-red-500"><span>Poin Ditukar</span><span>{viewSale.pointsRedeemed} poin</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t"><span>TOTAL</span><span style={{ color: "var(--teal-600)" }}>{formatRupiah(viewSale.total)}</span></div>
            </div>

            {viewSale.notes && <p className="text-sm text-gray-500 mt-3">Catatan: {viewSale.notes}</p>}
            <button onClick={() => setModal(null)} className="btn btn-secondary w-full mt-4">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
