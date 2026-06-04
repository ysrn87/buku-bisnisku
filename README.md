# buku-bisnisku — Next.js Fullstack (Siap Deploy ke Vercel)

Stack: **Next.js 16 (App Router) · TypeScript · Prisma · Neon PostgreSQL · NextAuth v5 · Tailwind v4**

---

## 🚀 Deploy ke Vercel (Langkah Demi Langkah)

### 1. Setup Database di Neon
1. Buka [console.neon.tech](https://console.neon.tech/) → Buat project baru
2. Copy **Connection String** (format: `postgresql://...@...neon.tech/...?sslmode=require`)
3. Di Neon SQL Editor, jalankan seluruh isi file `prisma/migration.sql`

### 2. Push ke GitHub
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/USERNAME/buku-bisnisku-nextjs.git
git push -u origin main
```

### 3. Deploy di Vercel
1. Import repo di [vercel.com/new](https://vercel.com/new)
2. Tambahkan **Environment Variables**:
   ```
   DATABASE_URL    = postgresql://...@....neon.tech/bukubisnisku?sslmode=require
   AUTH_SECRET     = (generate: openssl rand -base64 32)
   NEXTAUTH_URL    = https://nama-app-kamu.vercel.app
   ```
3. Klik **Deploy** — selesai!

### 4. Seed Data Awal
Setelah deploy, jalankan seed lewat Vercel CLI atau lokal:
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

**Akun Default:**
| Role          | Telepon         | Password     |
|---------------|-----------------|--------------|
| Administrator | 081111111111    | admin123     |
| Manager       | 082222222222    | manager123   |
| Member        | 083333333333    | member123    |

---

## 💻 Jalankan Lokal

```bash
# 1. Copy env
cp .env.example .env.local
# Edit DATABASE_URL dan AUTH_SECRET

# 2. Generate Prisma client
npx prisma generate

# 3. Jalankan migrasi (atau jalankan migration.sql manual di DB)
npx prisma db push

# 4. Seed data
npm run db:seed

# 5. Start
npm run dev
```

---

## 📁 Struktur Fitur

| Halaman                        | URL                                   |
|-------------------------------|---------------------------------------|
| Login                         | `/login`                              |
| Register Member               | `/register`                           |
| Dashboard Admin               | `/admin`                              |
| Produk & Varian               | `/admin/inventory/products`           |
| Manajemen Stok                | `/admin/inventory/stock`              |
| Penjualan Baru & Daftar       | `/admin/sales-customers/sales`        |
| Rekap Produk                  | `/admin/sales-customers/recap`        |
| Pelanggan (Member/Non-Member) | `/admin/sales-customers/customers`    |
| Arus Kas                      | `/admin/finance/cashflow`             |
| Laporan Keuangan              | `/admin/finance/reports`              |
| Pengaturan Poin               | `/admin/settings/points`              |
| Profil & Manager              | `/admin/settings/profile`             |
| Dashboard Member              | `/member`                             |
