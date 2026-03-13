import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("AUTHORIZE_STARTED:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("AUTHORIZE_FAILED: Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        console.log("AUTHORIZE_USER_FOUND:", user ? "YES" : "NO");

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        console.log("AUTHORIZE_PASSWORD_VALID:", isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ]
})
