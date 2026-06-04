import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or Phone" },
        password:   { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? "").trim();
        const password   = String(credentials?.password ?? "");
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: identifier.replace(/[^0-9+]/g, "") },
              { email: identifier.toLowerCase() },
            ],
          },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          name: String(user.name),
          email: user.email ? String(user.email) : undefined,
          role: String(user.role),
        };
      },
    }),
  ],
});