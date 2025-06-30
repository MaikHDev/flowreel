import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { users, follows } from "~/server/db/schema";
import { ilike, and, eq, or, ne } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      console.log(`Searching for users with query: ${input.query}`);
      const currentUserId = ctx.session.user.id;

      const matchedUsers = await db.query.users.findMany({
        where: and(
          or(
            ilike(users.name, `%${input.query}%`),
            ilike(users.email, `%${input.query}%`)
          ),
          ne(users.id, currentUserId)
        ),
      });
      console.log(`Found ${matchedUsers.length} matched users`);

      const followedUsers = await db.query.follows.findMany({
        where: eq(follows.followerId, currentUserId),
      });
      console.log(`Found ${followedUsers.length} followed users`);

      const followedIds = new Set(followedUsers.map((f) => f.followingId));

      return matchedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        followed: followedIds.has(u.id),
      }));
    }),

  followUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log(`Following user with ID: ${input.userId}`);
      const currentUserId = ctx.session.user.id;

      if (currentUserId === input.userId) {
        throw new Error("You cannot follow yourself.");
      }

      await db
        .insert(follows)
        .values({
          followerId: currentUserId,
          followingId: input.userId,
        })
        .onConflictDoNothing();
      console.log(`Followed user with ID: ${input.userId}`);

      return { success: true };
    }),

    unfollowUser: protectedProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const currentUserId = ctx.session.user.id;

    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, input.userId)
        )
      );

    return { success: true };
  }),

});