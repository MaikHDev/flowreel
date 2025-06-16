"use client";

import { signIn } from "next-auth/react";

export function SignIn() {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // 🔍 stop automatic redirect so we can inspect result
    });

    console.log("🧪 signIn result:", result);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Sign In</button>
    </form>
  );
}
