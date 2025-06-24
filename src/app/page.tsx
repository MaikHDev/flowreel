import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import ChatComponent from "~/app/_components/chat";
import Nav from "./_components/nav";
import { SearchUsers } from "./_components/search-And-following-logic";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  // if (session?.user) {
  //   void api.post.getLatest.prefetch();
  // }

  return (
    <HydrateClient>
      <header>
        <Nav />
      </header>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7F8] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        </div>
      </main>
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-center text-2xl text-white">
                  {session && <span>Logged in as {session.user?.name}</span>}
                </p>
                <Link
                  href={session ? "/api/auth/signout" : "/api/auth/signin"}
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  {session ? "Sign out" : "Sign in"}
                </Link>
                {session?.user?.id && <SearchUsers  />}
            </div>
    </HydrateClient>
  );
}
