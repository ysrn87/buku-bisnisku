/**
 * ERASE — Hapus semua data KECUALI data users & settings
 *
 * Yang dihapus:
 *   point_history, sale_items, sales, stock_movements,
 *   product_variants, products, customers, cashflows
 *
 * Yang DIPERTAHANKAN:
 *   users, settings
 *
 * Jalankan:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/erase.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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
  console.log("\n⚠️  ERASE — Hapus semua data kecuali users & settings");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Yang akan DIHAPUS:");
  console.log("  ✗  Riwayat poin (point_history)");
  console.log("  ✗  Item penjualan (sale_items)");
  console.log("  ✗  Penjualan (sales)");
  console.log("  ✗  Riwayat stok (stock_movements)");
  console.log("  ✗  Varian produk (product_variants)");
  console.log("  ✗  Produk (products)");
  console.log("  ✗  Pelanggan non-member (customers)");
  console.log("  ✗  Arus kas (cashflows)");
  console.log("\nYang akan DIPERTAHANKAN:");
  console.log("  ✓  Semua users (admin, manager, member)");
  console.log("  ✓  Settings aplikasi");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Tampilkan jumlah data yang akan dihapus
  const [
    pointHistoryCount,
    saleItemCount,
    saleCount,
    movementCount,
    variantCount,
    productCount,
    customerCount,
    cashflowCount,
    userCount,
  ] = await Promise.all([
    prisma.pointHistory.count(),
    prisma.saleItem.count(),
    prisma.sale.count(),
    prisma.stockMovement.count(),
    prisma.productVariant.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.cashflow.count(),
    prisma.user.count(),
  ]);

  console.log("📊 Data saat ini:");
  console.log(`   point_history   : ${pointHistoryCount} baris`);
  console.log(`   sale_items      : ${saleItemCount} baris`);
  console.log(`   sales           : ${saleCount} baris`);
  console.log(`   stock_movements : ${movementCount} baris`);
  console.log(`   product_variants: ${variantCount} baris`);
  console.log(`   products        : ${productCount} baris`);
  console.log(`   customers       : ${customerCount} baris`);
  console.log(`   cashflows       : ${cashflowCount} baris`);
  console.log(`   users           : ${userCount} baris (tidak akan dihapus)`);
  console.log("");

  const ok = await confirm("Lanjutkan hapus semua data di atas? (y/N): ");
  if (!ok) {
    console.log("\n❌ Dibatalkan.\n");
    return;
  }

  console.log("\n🗑️  Menghapus data...");

  // Urutan penghapusan penting — ikuti foreign key constraints
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

  // Reset poin semua user ke 0
  await prisma.user.updateMany({ data: { points: 0 } });
  console.log("   ✓ poin semua user di-reset ke 0");

  console.log("\n✅ Erase selesai! Database bersih, data users tetap ada.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Erase gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
