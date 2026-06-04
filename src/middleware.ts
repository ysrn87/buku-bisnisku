import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role ?? "";

  // Validasi role — jika role tidak dikenal, anggap tidak login
  const isAdmin  = role === "ADMINISTRATOR" || role === "MANAGER";
  const isMember = role === "MEMBER";
  const validRole = isAdmin || isMember;
  const authenticated = isLoggedIn && validRole;

  const isRoot       = nextUrl.pathname === "/";
  const isAuthPage   = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isAdminPage  = nextUrl.pathname.startsWith("/admin");
  const isMemberPage = nextUrl.pathname.startsWith("/member");

  // Root → redirect sesuai status login
  if (isRoot) {
    if (!authenticated) return NextResponse.redirect(new URL("/login", nextUrl));
    if (isAdmin)  return NextResponse.redirect(new URL("/admin", nextUrl));
    if (isMember) return NextResponse.redirect(new URL("/member", nextUrl));
  }

  // Halaman auth (login/register) → redirect jika sudah login
  if (isAuthPage && authenticated) {
    if (isAdmin)  return NextResponse.redirect(new URL("/admin", nextUrl));
    if (isMember) return NextResponse.redirect(new URL("/member", nextUrl));
  }

  // Halaman admin → wajib login + role admin/manager
  if (isAdminPage) {
    if (!authenticated) return NextResponse.redirect(new URL("/login", nextUrl));
    if (!isAdmin)       return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Halaman member → wajib login
  if (isMemberPage) {
    if (!authenticated) return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};