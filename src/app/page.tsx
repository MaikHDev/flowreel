import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import ChatComponent from "~/app/_components/chat";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {session?.user && <ChatComponent session={session} />}
    </HydrateClient>
  );
}
