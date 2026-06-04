import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role ?? "";

  const isAuthPage  = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isMemberPage = nextUrl.pathname.startsWith("/member");

  if (isAuthPage && isLoggedIn) {
    if (role === "ADMINISTRATOR" || role === "MANAGER")
      return NextResponse.redirect(new URL("/admin", nextUrl));
    return NextResponse.redirect(new URL("/member", nextUrl));
  }

  if (isAdminPage) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "ADMINISTRATOR" && role !== "MANAGER")
      return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isMemberPage && !isLoggedIn)
    return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};