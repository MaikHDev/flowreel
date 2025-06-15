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

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});


/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Google({ 
      clientId: env.GOOGLE_CLIENT_ID,  
      clientSecret: env.GOOGLE_CLIENT_SECRET,  
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
  credentials: {
    email: {},
    password: {},
  },
  authorize: async (credentials) => {
  const dbUser = await getUserFromDb(credentials.email as string, credentials.password as string);

  if (!dbUser.success || !dbUser.user) {
    console.error("❌ Login failed:", dbUser?.message);
    throw new Error("Invalid credentials");
  }

  const fullUser = await adapter.getUserByEmail!(dbUser.user.email);

  if (!fullUser) {
    console.error("❌ User not found via adapter");
    return null;
  }

  // ✅ Strip out extra fields like `password`
  const { id, email, name, image, emailVerified } = fullUser;

  const safeUser = { id, email, name, image, emailVerified };

  console.log("✅ Returning clean user to NextAuth authorize():", safeUser);
  return safeUser;
}

})

    
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: adapter,
  callbacks: {
  session: ({ session, user }) => {
    console.log("🧾 session callback called with:", { session, user });
    return {
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    };
  },
}

} satisfies NextAuthConfig;
