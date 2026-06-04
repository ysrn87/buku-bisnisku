"use client";
import { usePathname } from "next/navigation";

// Map pathname → judul halaman
const pageTitles: Record<string, string> = {
  "/admin": "Beranda",
  "/admin/inventory/products": "Produk",
  "/admin/inventory/stock": "Stok",
  "/admin/sales-customers/sales": "Penjualan",
  "/admin/sales-customers/recap": "Rekap",
  "/admin/sales-customers/customers": "Pelanggan",
  "/admin/finance/cashflow": "Arus Kas",
  "/admin/finance/reports": "Laporan",
  "/admin/settings/points": "Pengaturan Poin",
  "/admin/settings/profile": "Profil",
};

interface MobileHeaderProps {
  userName: string;
}

export default function MobileHeader({ userName }: MobileHeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "buku-bisnisku";
  const isHome = pathname === "/admin";

  return (
    <header className="mobile-header">
      <div className="flex items-center gap-3">
        {isHome ? (
          <>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--teal-600)" }}
            >
              <span className="text-base">🍳</span>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm leading-tight">buku-bisnisku</p>
              <p className="text-xs text-gray-400">Halo, {userName.split(" ")[0]} 👋</p>
            </div>
          </>
        ) : (
          <h1 className="font-bold text-gray-800 text-base">{title}</h1>
        )}
      </div>

      {isHome && (
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "var(--teal-100)", color: "var(--teal-600)" }}
        >
          Admin
        </div>
      )}
    </header>
  );
}
