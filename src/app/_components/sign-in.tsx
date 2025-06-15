"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignIn() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/", // You can set a different redirect target here
    });

    if (res?.error) {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" required />
      </label>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
