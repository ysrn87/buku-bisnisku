import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileHeader from "@/components/MobileHeader";
import Providers from "@/components/Providers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role ?? "";
  if (role !== "ADMINISTRATOR" && role !== "MANAGER") redirect("/login");

  const userName = session.user?.name ?? "";

  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-100">
        {/* Desktop: sidebar kiri */}
        <Sidebar userName={userName} userRole={role} />

        {/* Konten utama */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile: header atas (hanya tampil di mobile) */}
          <MobileHeader userName={userName} />

          {/* Konten halaman */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile: nav bawah (hanya tampil di mobile) */}
        <MobileBottomNav />
      </div>
    </Providers>
  );
}
