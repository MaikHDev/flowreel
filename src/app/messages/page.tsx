import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import ChatComponent from "~/app/_components/chat";

export default async function Messages() {
  const session = await auth();

return (
    <>
        <HydrateClient>
            {session?.user && <ChatComponent session={session}/>}
        </HydrateClient>
    </>
)

}