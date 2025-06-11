"use server"

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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

    await db.insert(users).values({
      email,
      password,
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