import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function saleNumber(index: number) {
  return `INV-${String(index).padStart(5, "0")}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database buku-bisnisku...\n");

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log("👤 Membuat users...");

  const [adminPw, mgrPw, kasirPw, ...memberPws] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("manager123", 10),
    bcrypt.hash("kasir123", 10),
    bcrypt.hash("member123", 10),
    bcrypt.hash("member123", 10),
    bcrypt.hash("member123", 10),
    bcrypt.hash("member123", 10),
    bcrypt.hash("member123", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { phone: "081111111111" },
    update: {},
    create: {
      name: "Administrator",
      phone: "081111111111",
      email: "admin@bukubisnisku.id",
      password: adminPw,
      role: "ADMINISTRATOR",
      points: 0,
      address: "Jl. bukubisnis Raya No. 1, Jakarta",
    },
  });

  const manager = await prisma.user.upsert({
    where: { phone: "082222222222" },
    update: {},
    create: {
      name: "Budi Santoso",
      phone: "082222222222",
      email: "manager@bukubisnisku.id",
      password: mgrPw,
      role: "MANAGER",
      points: 0,
      address: "Jl. Manajer No. 2, Jakarta",
    },
  });

  await prisma.user.upsert({
    where: { phone: "082233334444" },
    update: {},
    create: {
      name: "Sari Dewi",
      phone: "082233334444",
      email: "kasir@bukubisnisku.id",
      password: kasirPw,
      role: "MANAGER",
      points: 0,
      address: "Jl. Kasir No. 3, Jakarta",
    },
  });

  const memberData = [
    { name: "Andi Pratama",   phone: "083333333333", email: "andi@gmail.com",    points: 120, address: "Jl. Melati No. 5, Bekasi" },
    { name: "Rina Kusuma",    phone: "083344445555", email: "rina@gmail.com",    points: 85,  address: "Jl. Mawar No. 8, Depok" },
    { name: "Doni Setiawan",  phone: "083355556666", email: "doni@gmail.com",    points: 200, address: "Jl. Kenanga No. 12, Tangerang" },
    { name: "Siti Rahayu",    phone: "083366667777", email: "siti@gmail.com",    points: 45,  address: "Jl. Dahlia No. 3, Bogor" },
    { name: "Fajar Nugroho",  phone: "083377778888", email: "fajar@gmail.com",   points: 310, address: "Jl. Anggrek No. 7, Bandung" },
  ];

  const members = await Promise.all(
    memberData.map((m, i) =>
      prisma.user.upsert({
        where: { phone: m.phone },
        update: {},
        create: { ...m, password: memberPws[i], role: "MEMBER" },
      })
    )
  );

  console.log(`   ✓ ${2 + 1 + members.length} users dibuat`);

  // ── 2. Settings ───────────────────────────────────────────────────────────
  console.log("⚙️  Membuat settings...");

  const settingsData = [
    { key: "storeName",              value: "bukubisnis Ku",  description: "Nama toko" },
    { key: "storeAddress",           value: "Jl. bukubisnis Raya No. 1, Jakarta", description: "Alamat toko" },
    { key: "storePhone",             value: "021-12345678", description: "Nomor telepon toko" },
    { key: "pointsConversionRate",   value: "1000",       description: "Nilai 1 poin dalam Rupiah" },
    { key: "minPointsForRedemption", value: "10",         description: "Minimum poin untuk ditukar" },
    { key: "maxPointsPerTransaction",value: "1000",       description: "Maksimum poin per transaksi" },
    { key: "taxRate",                value: "0",          description: "Persentase pajak (0 = tidak ada)" },
    { key: "receiptFooter",          value: "Terima kasih telah berbelanja di bukubisnis Ku!", description: "Pesan di struk" },
  ];

  for (const s of settingsData) {
    await prisma.settings.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log(`   ✓ ${settingsData.length} settings dibuat`);

  // ── 3. Products ───────────────────────────────────────────────────────────
  console.log("📦 Membuat produk...");

  const productsData = [
    {
      name: "Indomie Goreng", sku: "MIE-001", type: "READY_STOCK",
      description: "Mie instan goreng paling populer",
      variants: [
        { name: "1 Pcs",    sku: "MIE-001-1",  price: 3500,  cost: 2800,  stock: 500, lowStock: 50,  points: 1 },
        { name: "1 Dus (40 pcs)", sku: "MIE-001-40", price: 120000, cost: 95000, stock: 30,  lowStock: 5,   points: 10 },
      ],
    },
    {
      name: "Beras Premium", sku: "BRS-001", type: "READY_STOCK",
      description: "Beras putih pulen kualitas premium",
      variants: [
        { name: "5 Kg",  sku: "BRS-001-5",  price: 75000,  cost: 60000,  stock: 100, lowStock: 10, points: 7 },
        { name: "10 Kg", sku: "BRS-001-10", price: 145000, cost: 115000, stock: 60,  lowStock: 5,  points: 14 },
        { name: "25 Kg", sku: "BRS-001-25", price: 350000, cost: 280000, stock: 20,  lowStock: 3,  points: 35 },
      ],
    },
    {
      name: "Minyak Goreng Bimoli", sku: "MYK-001", type: "READY_STOCK",
      description: "Minyak goreng jernih dari kelapa sawit pilihan",
      variants: [
        { name: "1 Liter",  sku: "MYK-001-1",  price: 18000, cost: 14000, stock: 200, lowStock: 20, points: 2 },
        { name: "2 Liter",  sku: "MYK-001-2",  price: 34000, cost: 26000, stock: 150, lowStock: 15, points: 3 },
        { name: "5 Liter",  sku: "MYK-001-5",  price: 80000, cost: 62000, stock: 80,  lowStock: 8,  points: 8 },
      ],
    },
    {
      name: "Gula Pasir", sku: "GLA-001", type: "READY_STOCK",
      description: "Gula pasir putih bersih",
      variants: [
        { name: "1 Kg", sku: "GLA-001-1", price: 15000, cost: 12000, stock: 300, lowStock: 30, points: 1 },
        { name: "5 Kg", sku: "GLA-001-5", price: 72000, cost: 57000, stock: 100, lowStock: 10, points: 7 },
      ],
    },
    {
      name: "Teh Botol Sosro", sku: "THE-001", type: "READY_STOCK",
      description: "Minuman teh manis dalam botol",
      variants: [
        { name: "250 ml", sku: "THE-001-250", price: 5000,  cost: 3500,  stock: 400, lowStock: 40, points: 1 },
        { name: "1 Liter", sku: "THE-001-1L", price: 12000, cost: 9000,  stock: 200, lowStock: 20, points: 1 },
      ],
    },
    {
      name: "Sabun Lifebuoy", sku: "SBN-001", type: "READY_STOCK",
      description: "Sabun mandi antibakteri",
      variants: [
        { name: "85 gr",  sku: "SBN-001-85",  price: 5500,  cost: 4000,  stock: 250, lowStock: 25, points: 1 },
        { name: "110 gr", sku: "SBN-001-110", price: 7000,  cost: 5200,  stock: 200, lowStock: 20, points: 1 },
      ],
    },
    {
      name: "Rokok Sampoerna Mild", sku: "RKK-001", type: "READY_STOCK",
      description: "Rokok mild filter 16 batang",
      variants: [
        { name: "1 Bungkus", sku: "RKK-001-1",  price: 27000, cost: 22000, stock: 300, lowStock: 30, points: 2 },
        { name: "1 Slop",    sku: "RKK-001-10", price: 260000, cost: 210000, stock: 50, lowStock: 5,  points: 20 },
      ],
    },
    {
      name: "Kopi Kapal Api", sku: "KPI-001", type: "READY_STOCK",
      description: "Kopi bubuk asli pilihan",
      variants: [
        { name: "165 gr", sku: "KPI-001-165", price: 18000, cost: 13500, stock: 180, lowStock: 20, points: 2 },
        { name: "380 gr", sku: "KPI-001-380", price: 40000, cost: 30000, stock: 100, lowStock: 10, points: 4 },
      ],
    },
    {
      name: "Snack Chitato", sku: "SNK-001", type: "READY_STOCK",
      description: "Keripik kentang renyah aneka rasa",
      variants: [
        { name: "68 gr - Sapi Panggang", sku: "SNK-001-SP", price: 12000, cost: 9000, stock: 150, lowStock: 20, points: 1 },
        { name: "68 gr - Jagung Bakar",  sku: "SNK-001-JB", price: 12000, cost: 9000, stock: 150, lowStock: 20, points: 1 },
      ],
    },
    {
      name: "Hampers Lebaran Spesial", sku: "HMP-001", type: "PREORDER",
      description: "Paket hampers lebaran isi 10 produk pilihan",
      variants: [
        { name: "Paket Silver", sku: "HMP-001-SLV", price: 250000, cost: 180000, stock: 0, lowStock: 0, points: 25 },
        { name: "Paket Gold",   sku: "HMP-001-GLD", price: 450000, cost: 320000, stock: 0, lowStock: 0, points: 45 },
      ],
    },
  ];

  const createdProducts: { id: string; variants: { id: string; price: number; points: number; sku: string }[] }[] = [];

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          type: p.type as "READY_STOCK" | "PREORDER",
          description: p.description,
          createdById: admin.id,
        },
      });

      const variants = await Promise.all(
        p.variants.map((v) =>
          prisma.productVariant.create({
            data: { productId: product.id, ...v },
          })
        )
      );

      // Stock movement awal
      for (const v of variants) {
        if (v.stock > 0) {
          await prisma.stockMovement.create({
            data: {
              variantId: v.id,
              quantity: v.stock,
              type: "IN",
              notes: "Stok awal",
            },
          });
        }
      }

      createdProducts.push({
        id: product.id,
        variants: variants.map((v) => ({ id: v.id, price: Number(v.price), points: v.points, sku: v.sku })),
      });
    }
  }

  console.log(`   ✓ ${createdProducts.length} produk dibuat`);

  // ── 4. Non-member Customers ───────────────────────────────────────────────
  console.log("🧑‍🤝‍🧑 Membuat customers (non-member)...");

  const customersData = [
    { name: "Pak Hendra",   phone: "085600001111", address: "Jl. Sudirman No. 10" },
    { name: "Bu Wati",      phone: "085600002222", address: "Jl. Thamrin No. 5" },
    { name: "Pak Joko",     phone: "085600003333", address: "Jl. Gatot Subroto No. 7" },
    { name: "Bu Lastri",    phone: "085600004444", address: "Jl. Diponegoro No. 3" },
    { name: "Pak Iwan",     phone: "085600005555", address: "Jl. Ahmad Yani No. 15" },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      prisma.customer.upsert({
        where: { phone: c.phone },
        update: {},
        create: c,
      })
    )
  );

  console.log(`   ✓ ${customers.length} customers dibuat`);

  // ── 5. Sales ──────────────────────────────────────────────────────────────
  console.log("🧾 Membuat transaksi penjualan...");

  if (createdProducts.length === 0) {
    console.log("   ⚠️  Produk sudah ada, skip pembuatan transaksi");
  } else {
    // Flatten all variants for easy random pick
    const allVariants = createdProducts
      .filter((p) => !productsData.find((pd) => pd.type === "PREORDER" && createdProducts.indexOf(p) === productsData.indexOf(pd)))
      .flatMap((p) => p.variants)
      .filter((v) => !v.sku.startsWith("HMP-")); // skip preorder

    const paymentMethods = ["CASH", "QRIS", "TRANSFER", "EDC"];
    let saleIndex = 1;

    // 30 hari transaksi
    for (let day = 29; day >= 0; day--) {
      const txCount = randInt(3, 8);
      const txDate = daysAgo(day);

      for (let t = 0; t < txCount; t++) {
        const isMember = Math.random() > 0.5;
        const cashier = Math.random() > 0.5 ? admin : manager;
        const paymentMethod = paymentMethods[randInt(0, paymentMethods.length - 1)];

        // Pilih 1-3 variant acak
        const itemCount = randInt(1, 3);
        const pickedVariants = [...allVariants]
          .sort(() => Math.random() - 0.5)
          .slice(0, itemCount);

        const items = pickedVariants.map((v) => {
          const qty = randInt(1, 5);
          return { variantId: v.id, quantity: qty, price: v.price, subtotal: v.price * qty };
        });

        const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
        const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.05 / 1000) * 1000 : 0;
        const total = subtotal - discount;
        const pointsEarned = Math.floor(total / 10000);
        const pointsRedeemed = isMember && Math.random() > 0.7 ? randInt(5, 20) : 0;

        const sale = await prisma.sale.create({
          data: {
            saleNumber: saleNumber(saleIndex++),
            cashierId: cashier.id,
            customerId: isMember && members.length > 0 ? members[randInt(0, members.length - 1)].id : undefined,
            nonMemberCustomerId: !isMember && Math.random() > 0.4 ? customers[randInt(0, customers.length - 1)].id : undefined,
            subtotal,
            discount,
            tax: 0,
            ongkir: 0,
            total,
            paymentMethod,
            paymentStatus: "PAID",
            pointsEarned,
            pointsRedeemed,
            createdAt: txDate,
            items: { create: items },
          },
        });

        // Point history untuk member
        if (isMember && sale.customerId && pointsEarned > 0) {
          await prisma.pointHistory.create({
            data: {
              userId: sale.customerId,
              points: pointsEarned,
              type: "EARN",
              description: `Poin dari transaksi ${sale.saleNumber}`,
              createdAt: txDate,
            },
          });
        }

        if (isMember && sale.customerId && pointsRedeemed > 0) {
          await prisma.pointHistory.create({
            data: {
              userId: sale.customerId,
              points: -pointsRedeemed,
              type: "REDEEM",
              description: `Penukaran poin di transaksi ${sale.saleNumber}`,
              createdAt: txDate,
            },
          });
        }
      }
    }

    console.log(`   ✓ ~${saleIndex - 1} transaksi dibuat (30 hari)`);
  }

  // ── 6. Cashflow ───────────────────────────────────────────────────────────
  console.log("💰 Membuat cashflow...");

  const cashflowData = [
    // Pengeluaran rutin
    { type: "EXPENSE", category: "Belanja Stok",     amount: 5000000, description: "Belanja stok mingguan ke distributor",   daysAgo: 28 },
    { type: "EXPENSE", category: "Listrik & Air",    amount: 850000,  description: "Tagihan listrik dan air bulan ini",      daysAgo: 25 },
    { type: "EXPENSE", category: "Belanja Stok",     amount: 3500000, description: "Belanja stok minyak dan sembako",        daysAgo: 21 },
    { type: "EXPENSE", category: "Gaji Karyawan",    amount: 3000000, description: "Gaji kasir bulan ini",                  daysAgo: 20 },
    { type: "EXPENSE", category: "Sewa Tempat",      amount: 2500000, description: "Sewa ruko bulan ini",                   daysAgo: 15 },
    { type: "EXPENSE", category: "Belanja Stok",     amount: 4200000, description: "Belanja stok mingguan ke grosir",       daysAgo: 14 },
    { type: "EXPENSE", category: "Perlengkapan",     amount: 350000,  description: "Beli kantong plastik dan struk kasir",  daysAgo: 10 },
    { type: "EXPENSE", category: "Belanja Stok",     amount: 2800000, description: "Belanja stok rokok dan minuman",        daysAgo: 7  },
    { type: "EXPENSE", category: "Internet",         amount: 200000,  description: "Tagihan internet dan QRIS",             daysAgo: 5  },
    { type: "EXPENSE", category: "Belanja Stok",     amount: 1500000, description: "Belanja stok snack dan kopi",           daysAgo: 2  },
    // Pemasukan non-penjualan
    { type: "INCOME",  category: "Modal Awal",       amount: 20000000, description: "Modal awal membuka bukubisnis",            daysAgo: 29 },
    { type: "INCOME",  category: "Pendapatan Lain",  amount: 500000,  description: "Komisi agen PPOB (listrik, BPJS)",      daysAgo: 10 },
    { type: "INCOME",  category: "Pendapatan Lain",  amount: 350000,  description: "Komisi agen PPOB bulan ini",            daysAgo: 3  },
  ];

  for (const c of cashflowData) {
    await prisma.cashflow.create({
      data: {
        type: c.type as "INCOME" | "EXPENSE",
        category: c.category,
        amount: c.amount,
        description: c.description,
        date: daysAgo(c.daysAgo),
        createdById: admin.id,
      },
    });
  }

  console.log(`   ✓ ${cashflowData.length} entri cashflow dibuat`);

  // ── 7. Point history awal untuk members ───────────────────────────────────
  console.log("⭐ Membuat point history awal...");

  for (const member of members) {
    if (member.points > 0) {
      await prisma.pointHistory.create({
        data: {
          userId: member.id,
          points: member.points,
          type: "EARN",
          description: "Poin awal member",
          createdAt: daysAgo(30),
        },
      });
    }
  }

  console.log(`   ✓ Point history awal dibuat`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed selesai!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 Akun Login:");
  console.log("   ADMIN    → 081111111111 / admin123");
  console.log("   MANAGER  → 082222222222 / manager123");
  console.log("   KASIR    → 082233334444 / kasir123");
  console.log("   MEMBER   → 083333333333 / member123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });