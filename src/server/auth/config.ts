import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig, type User } from "next-auth";
import Google from "@auth/core/providers/google";
import { env } from "~/env.js";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";
import Credentials from "next-auth/providers/credentials";
import { getUserFromDb } from "~/actions/user.actions";

// ✅ Create adapter ONCE and reuse it
export const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

/**
 * Module augmentation for `next-auth` types
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js
 */
export const authConfig = {
  adapter, // ✅ use already-declared adapter
  debug: true,

  session: {
    strategy: "database", // ✅ uses the `session` table
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("🔐 Credentials login attempt", credentials);

        const dbUser = await getUserFromDb(
          credentials.email as string,
          credentials.password as string
        );

        if (!dbUser.success || !dbUser.user) {
          console.error("❌ Login failed:", dbUser?.message);
          return null;
        }

        const fullUser = await adapter.getUserByEmail!(
          dbUser.user.email
        );

        if (!fullUser) {
          console.error("❌ User not found via adapter");
          return null;
        }

        // ✅ This object must include only properties expected by NextAuth
        const safeUser = {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          image: fullUser.image,
          emailVerified: fullUser.emailVerified,
        };

        console.log("✅ Returning safe user to NextAuth authorize():", safeUser);
        return safeUser;
      },
    }),
  ],

  callbacks: {
    session: async ({ session, user }) => {
      console.log("🧾 session callback called with:", { session, user });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },
} satisfies NextAuthConfig;
