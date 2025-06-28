import { auth } from "~/server/auth";
import { SessionProvider } from "next-auth/react";
import PostPage from "~/app/profile/[name]/profile";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";

export default async function Home({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const resolvedParams = await params;
  const userName = resolvedParams.name;

  if (!userName) {
    return {
      notFound: true,
    };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.name, userName),
      columns: {
        name: true,
      },
    });

    if (!user) {
      return {
        notFound: true,
      };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      notFound: true,
    };
  }

  const session = await auth();

  return (
    <>
      <SessionProvider session={session}>
        <PostPage userName={userName}></PostPage>
      </SessionProvider>
    </>
  );
}
