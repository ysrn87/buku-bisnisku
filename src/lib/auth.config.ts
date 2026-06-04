import type { NextAuthConfig } from "next-auth";

// Auth config yang aman untuk Edge Runtime (middleware)
// Tidak boleh import prisma, bcryptjs, atau pg di sini
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id   = String(user.id ?? "");
        token.role = String(user.role ?? "MEMBER");
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      session.user.id   = String(token.id ?? "");
      session.user.role = String(token.role ?? "MEMBER");
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
};
