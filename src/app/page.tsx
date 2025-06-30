import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SearchUsers } from "./_components/search-And-following-logic";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen align-top flex-col justify-center bg-[#F4F7F8] text-white">
                {session?.user?.id && <SearchUsers  />}
      </main>
    </HydrateClient>
  );
}
