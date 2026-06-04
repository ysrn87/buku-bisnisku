import Providers from "@/components/Providers";
import { Suspense } from "react";
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Providers><Suspense>{children}</Suspense></Providers>;
}
