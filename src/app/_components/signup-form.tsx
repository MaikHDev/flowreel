"use server";

import { db } from "~/server/db";
import { users, accounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function SignUp() {
  async function handleSignup(formData: FormData): Promise<void> {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return;
    }

    const existedUser = await db.query.users.findFirst({
      where: (u) => eq(u.email, email),
    });

    if (existedUser) {
      return;
    }

    const userId = randomUUID();

    // 1. Create the user
    await db.insert(users).values({
      id: userId,
      email,
      password,
    });

    // 2. Link to credentials provider
    await db.insert(accounts).values({
  userId,
  type: "email", // ✅ this is the key fix
  provider: "credentials",
  providerAccountId: email,
});

  }

  return (
    <form action={handleSignup}>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" />
      </label>
      <button>Sign Up</button>
    </form>
  );
}
