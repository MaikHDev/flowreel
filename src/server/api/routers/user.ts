import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { users, follows, blocks } from "~/server/db/schema";
import { ilike, and, eq, or, ne } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const matchedUsers = await db.query.users.findMany({
        where: and(
          or(
            ilike(users.name, `%${input.query}%`),
            ilike(users.email, `%${input.query}%`),
          ),
          ne(users.id, currentUserId),
        ),
      });

      const followAsFollower = await db.query.follows.findMany({
        where: eq(follows.followerId, currentUserId),
      });

      const followAsTarget = await db.query.follows.findMany({
        where: eq(follows.followingId, currentUserId),
      });

      return matchedUsers.map((u) => {
        const youFollow = followAsFollower.find((f) => f.followingId === u.id);
        const theyFollow = followAsTarget.find((f) => f.followerId === u.id);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          youFollowThem: !!youFollow?.accepted,
          theyFollowYou: !!theyFollow?.accepted,
          requestedMe: !!theyFollow && !theyFollow.accepted,
          requestedThem: !!youFollow && !youFollow.accepted,
          mutualFollow: !!youFollow?.accepted && !!theyFollow?.accepted,
        };
      });
    }),

  requestFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      if (currentUserId === input.userId) {
        throw new Error("You cannot follow yourself.");
      }

      await db
        .insert(follows)
        .values({
          followerId: currentUserId,
          followingId: input.userId,
          requestedAt: new Date(),
          accepted: false,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  acceptFollow: protectedProcedure
    .input(z.object({ followerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      await db
        .update(follows)
        .set({
          accepted: true,
          followedAt: new Date(),
        })
        .where(
          and(
            eq(follows.followerId, input.followerId),
            eq(follows.followingId, currentUserId),
          ),
        );

      return { success: true };
    }),

  removeFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            eq(follows.followingId, input.userId),
          ),
        );

      return { success: true };
    }),
  blockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(blocks).values({
        blockerId: ctx.session.user.id,
        blockedId: input.userId,
      }).onConflictDoNothing();
      return { success: true };
    }),

  unblockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(blocks).where(
        and(
          eq(blocks.blockerId, ctx.session.user.id),
          eq(blocks.blockedId, input.userId)
        )
      );
      return { success: true };
    }),
});
