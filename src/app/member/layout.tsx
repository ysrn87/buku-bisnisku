import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Providers from "@/components/Providers";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <Providers>
      <div className="min-h-screen" style={{ background: "var(--gray-50)" }}>
        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--teal-600)" }}>🍳</div>
            <span className="font-bold text-gray-800">buku-bisnisku</span>
          </div>
          <span className="text-sm text-gray-500">Member Area</span>
        </header>
        <main className="max-w-lg mx-auto p-5">{children}</main>
      </div>
    </Providers>
  );
}
