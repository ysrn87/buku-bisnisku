import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role ?? "";

  const isRootPage   = nextUrl.pathname === "/"; // 1. Track the root page
  const isAuthPage   = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isAdminPage  = nextUrl.pathname.startsWith("/admin");
  const isMemberPage = nextUrl.pathname.startsWith("/member");

  // 2. Handle Root Page Redirects
  if (isRootPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl)); // Send guests to login
    }
    if (role === "ADMINISTRATOR" || role === "MANAGER") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/member", nextUrl));
  }

  // Handle Auth Pages (Login / Register)
  if (isAuthPage && isLoggedIn) {
    if (role === "ADMINISTRATOR" || role === "MANAGER")
      return NextResponse.redirect(new URL("/admin", nextUrl));
    return NextResponse.redirect(new URL("/member", nextUrl));
  }

  // Handle Admin Pages
  if (isAdminPage) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "ADMINISTRATOR" && role !== "MANAGER")
      return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Handle Member Pages
  if (isMemberPage && !isLoggedIn)
    return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};