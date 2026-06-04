export function formatRupiah(amount: number | string): string {
  const num = Math.floor(Number(amount));
  const s = String(num);
  let result = "";
  const n = s.length;
  for (let i = 0; i < n; i++) {
    if (i > 0 && (n - i) % 3 === 0) result += ".";
    result += s[i];
  }
  return "Rp " + result;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const months = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const months = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function generateSaleNumber(): string {
  const ts = Date.now();
  const r = Math.floor(Math.random() * 1000);
  return `SALE-${ts}-${String(r).padStart(3, "0")}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function pointsExpiryDate(earned: Date): Date {
  return new Date(earned.getFullYear(), 11, 31, 23, 59, 59);
}
