"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

// 5 item utama di bottom bar + drawer "Lainnya"
const mainItems = [
  {
    href: "/admin",
    label: "Beranda",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
      </svg>
    ),
  },
  {
    href: "/admin/sales-customers/sales",
    label: "Penjualan",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
  },
  {
    href: "/admin/inventory/products",
    label: "Produk",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
      </svg>
    ),
  },
  {
    href: "/admin/finance/cashflow",
    label: "Keuangan",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
];

// Item di "Lainnya" drawer
const moreGroups = [
  {
    section: "Inventaris",
    items: [
      { href: "/admin/inventory/stock", label: "Stok", emoji: "📋" },
    ],
  },
  {
    section: "Penjualan",
    items: [
      { href: "/admin/sales-customers/recap", label: "Rekap Penjualan", emoji: "📊" },
      { href: "/admin/sales-customers/customers", label: "Pelanggan", emoji: "👥" },
    ],
  },
  {
    section: "Keuangan",
    items: [
      { href: "/admin/finance/reports", label: "Laporan", emoji: "📈" },
    ],
  },
  {
    section: "Pengaturan",
    items: [
      { href: "/admin/settings/points", label: "Poin", emoji: "⭐" },
      { href: "/admin/settings/profile", label: "Profil & Akun", emoji: "👤" },
    ],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // Cek apakah halaman aktif ada di "Lainnya"
  const moreActive = moreGroups.some(g => g.items.some(i => isActive(i.href)));
  // Cek apakah salah satu dari main items aktif
  const anyMainActive = mainItems.some(i => isActive(i.href, i.exact));

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="mobile-bottom-nav">
        {mainItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${active ? " active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Lainnya button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`mobile-nav-item${moreActive && !anyMainActive ? " active" : ""}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span>Lainnya</span>
        </button>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`mobile-drawer${drawerOpen ? " open" : ""}`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--teal-600)" }}>
              <span className="text-sm">🍳</span>
            </div>
            <span className="font-bold text-gray-800">Menu Lainnya</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Menu groups */}
        <div className="overflow-y-auto px-4 py-3 pb-8">
          {moreGroups.map((group) => (
            <div key={group.section} className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        active
                          ? "font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      style={active ? { background: "var(--teal-100)", color: "var(--teal-600)" } : {}}
                    >
                      <span className="text-lg w-7 text-center">{item.emoji}</span>
                      <span className="text-sm">{item.label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--teal-600)" }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Keluar */}
          <div className="mt-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all"
            >
              <span className="text-lg w-7 text-center">🚪</span>
              <span className="text-sm font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
