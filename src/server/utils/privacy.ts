import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { profiles } from "~/server/db/schema";

/**
 * Fetch the post visibility setting for a given user.
 */
export async function getPostVisibilityForUser(userId: string): Promise<"public" | "private" | "followers"> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      defaultPostVisibility: true,
    },
  });

  return profile?.defaultPostVisibility ?? "public";
}