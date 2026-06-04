/**
 * RESET — Hapus SEMUA data tanpa terkecuali, lalu isi ulang data default
 *
 * Yang dihapus (semua tabel):
 *   point_history, sale_items, sales, stock_movements,
 *   product_variants, products, customers, cashflows,
 *   settings, users
 *
 * Setelah reset, akan dibuat ulang:
 *   - 1 admin, 1 manager (akun default)
 *   - Settings default
 *
 * Jalankan:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/reset.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Konfirmasi interaktif ──────────────────────────────────────────────────
function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔴 RESET — Hapus SEMUA data tanpa terkecuali");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Semua tabel akan dikosongkan, termasuk:");
  console.log("  ✗  users (admin, manager, member — SEMUA dihapus)");
  console.log("  ✗  settings");
  console.log("  ✗  products & product_variants");
  console.log("  ✗  sales & sale_items");
  console.log("  ✗  stock_movements");
  console.log("  ✗  customers (non-member)");
  console.log("  ✗  cashflows");
  console.log("  ✗  point_history");
  console.log("\nSetelah reset, akan dibuat ulang:");
  console.log("  ✓  Admin  → 081111111111 / admin123");
  console.log("  ✓  Manager→ 082222222222 / manager123");
  console.log("  ✓  Settings default");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Tampilkan ringkasan data yang ada
  const [userCount, productCount, saleCount, cashflowCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.sale.count(),
    prisma.cashflow.count(),
  ]);

  console.log("📊 Data saat ini:");
  console.log(`   users    : ${userCount} baris`);
  console.log(`   products : ${productCount} baris`);
  console.log(`   sales    : ${saleCount} baris`);
  console.log(`   cashflows: ${cashflowCount} baris`);
  console.log("");

  // Konfirmasi dua kali karena operasi ini tidak bisa dibatalkan
  const ok1 = await confirm("⚠️  Ini akan menghapus SEMUA data termasuk users. Lanjutkan? (y/N): ");
  if (!ok1) { console.log("\n❌ Dibatalkan.\n"); return; }

  const ok2 = await confirm("🔴 Konfirmasi terakhir — yakin ingin reset total? (y/N): ");
  if (!ok2) { console.log("\n❌ Dibatalkan.\n"); return; }

  console.log("\n🗑️  Menghapus semua data...");

  // Urutan penghapusan mengikuti foreign key constraints
  await prisma.pointHistory.deleteMany({});
  console.log("   ✓ point_history dihapus");

  await prisma.saleItem.deleteMany({});
  console.log("   ✓ sale_items dihapus");

  await prisma.sale.deleteMany({});
  console.log("   ✓ sales dihapus");

  await prisma.stockMovement.deleteMany({});
  console.log("   ✓ stock_movements dihapus");

  await prisma.productVariant.deleteMany({});
  console.log("   ✓ product_variants dihapus");

  await prisma.product.deleteMany({});
  console.log("   ✓ products dihapus");

  await prisma.customer.deleteMany({});
  console.log("   ✓ customers dihapus");

  await prisma.cashflow.deleteMany({});
  console.log("   ✓ cashflows dihapus");

  await prisma.settings.deleteMany({});
  console.log("   ✓ settings dihapus");

  await prisma.user.deleteMany({});
  console.log("   ✓ users dihapus");

  // ── Buat ulang data default ──────────────────────────────────────────────
  console.log("\n🌱 Membuat ulang data default...");

  const [adminPw, mgrPw] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("manager123", 10),
  ]);

  await prisma.user.create({
    data: {
      name: "Administrator",
      phone: "081111111111",
      email: "admin@bukubisnisku.id",
      password: adminPw,
      role: "ADMINISTRATOR",
      points: 0,
      address: "Jl. bukubisnis Raya No. 1",
    },
  });
  console.log("   ✓ Admin dibuat (081111111111 / admin123)");

  await prisma.user.create({
    data: {
      name: "Manager Utama",
      phone: "082222222222",
      email: "manager@bukubisnisku.id",
      password: mgrPw,
      role: "MANAGER",
      points: 0,
      address: "Jl. Manager No. 2",
    },
  });
  console.log("   ✓ Manager dibuat (082222222222 / manager123)");

  const defaultSettings = [
    { key: "storeName",               value: "bukubisnis Ku",                                    description: "Nama toko" },
    { key: "storeAddress",            value: "Jl. bukubisnis Raya No. 1, Jakarta",                description: "Alamat toko" },
    { key: "storePhone",              value: "021-12345678",                                  description: "Nomor telepon toko" },
    { key: "pointsConversionRate",    value: "1000",                                          description: "Nilai 1 poin dalam Rupiah" },
    { key: "minPointsForRedemption",  value: "10",                                            description: "Minimum poin untuk ditukar" },
    { key: "maxPointsPerTransaction", value: "1000",                                          description: "Maksimum poin per transaksi" },
    { key: "taxRate",                 value: "0",                                             description: "Persentase pajak (0 = tidak ada)" },
    { key: "receiptFooter",           value: "Terima kasih telah berbelanja di bukubisnis Ku!",   description: "Pesan di struk" },
  ];

  for (const s of defaultSettings) {
    await prisma.settings.create({ data: s });
  }
  console.log(`   ✓ ${defaultSettings.length} settings default dibuat`);

  console.log("\n✅ Reset selesai! Database kembali bersih dengan akun default.\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 Akun Login:");
  console.log("   ADMIN   → 081111111111 / admin123");
  console.log("   MANAGER → 082222222222 / manager123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Reset gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
