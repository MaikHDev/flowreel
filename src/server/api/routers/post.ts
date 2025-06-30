import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  comments,
  posts,
  userLikedPosts,
  users,
  follows,
  profiles,
} from "~/server/db/schema";
import { and, desc, eq, inArray, sql, ilike } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ userId: z.string(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(posts).values({
        userId: input.userId,
        message: input.message,
      });
    }),

  getLatest: protectedProcedure
    .input(
      z.object({ userName: z.string(), currentUser: z.string().nullable() }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.name, input.userName),
      });
      if (!user) return [];

      const profile = await ctx.db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.id, user.id),
        columns: { defaultPostVisibility: true },
      });

      const visibility = profile?.defaultPostVisibility ?? "public";
      const currentUser = input.currentUser;

      let canView = false;

      if (currentUser === user.id) {
        canView = true;
      } else if (visibility === "public") {
        canView = true;
      } else if (visibility === "followers" && currentUser) {
        const [follow] = await ctx.db
          .select()
          .from(follows)
          .where(
            and(
              eq(follows.followerId, currentUser),
              eq(follows.followingId, user.id),
              eq(follows.accepted, true),
            ),
          );
        canView = !!follow;
      }

      if (!canView) return [];

      const userPosts = await ctx.db.query.posts.findMany({
        where: (posts, { eq }) =>
          eq(
            posts.userId,
            ctx.db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.name, input.userName))
              .limit(1),
          ),
        with: {
          user: {
            columns: {
              name: true,
              image: true,
            },
          },
          comments: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              replies: {
                with: {
                  user: {
                    columns: {
                      name: true,
                      image: true,
                    },
                  },
                  replies: {
                    with: {
                      user: {
                        columns: {
                          name: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
                orderBy: (comments, { asc }) => [asc(comments.createdAt)],
              },
            },
            where: (comments, { isNull }) => isNull(comments.parentId),
            orderBy: (comments, { asc }) => [asc(comments.createdAt)],
          },
          likedBy: input.currentUser
            ? {
                where: (likes, { eq }) => eq(likes.userId, input.currentUser!),
              }
            : undefined,
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });

      const postIds = userPosts.map((post) => post.id);
      const likeCounts = await ctx.db
        .select({
          postId: userLikedPosts.postId,
          count: sql<number>`COUNT(*)`.mapWith(Number),
        })
        .from(userLikedPosts)
        .where(inArray(userLikedPosts.postId, postIds))
        .groupBy(userLikedPosts.postId);

      const likeCountMap = new Map(
        likeCounts.map((lc) => [lc.postId, lc.count]),
      );

      return userPosts.map((post) => ({
        id: post.id,
        message: post.message,
        createdAt: post.createdAt,
        user: post.user,
        likeCount: likeCountMap.get(post.id) ?? 0,
        likedByCurrentUser: post.likedBy && post.likedBy.length > 0,
        commentCount: post.comments.reduce(
          (total, comment) => total + 1 + (comment.replies?.length || 0),
          0,
        ),
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: comment.user,
          replies:
            comment.replies?.map((reply) => ({
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt,
              updatedAt: reply.updatedAt,
              user: reply.user,
              replies: reply.replies || [],
            })) || [],
        })),
      }));
    }),

  likePost: protectedProcedure
    .input(z.object({ postId: z.number(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [liked] = await ctx.db
        .select()
        .from(userLikedPosts)
        .where(
          and(
            eq(userLikedPosts.userId, input.userId),
            eq(userLikedPosts.postId, input.postId),
          ),
        );
      if (liked) {
        await ctx.db
          .delete(userLikedPosts)
          .where(
            and(
              eq(userLikedPosts.userId, input.userId),
              eq(userLikedPosts.postId, input.postId),
            ),
          );
      } else {
        await ctx.db.insert(userLikedPosts).values({
          userId: input.userId,
          postId: input.postId,
        });
      }
    }),

  comment: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        postId: z.number(),
        userId: z.string(),
        parentId: z.number().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(comments).values({
        content: input.content,
        userId: input.userId,
        postId: input.postId,
        parentId: input.parentId,
      });
    }),
  searchPostMessages: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const postsWithUsers = await ctx.db
        .select({
          id: posts.id,
          message: posts.message,
          userId: posts.userId,
          userName: users.name,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(ilike(posts.message, `%${input.query}%`))
        .orderBy(desc(posts.createdAt));

      const userIds = [...new Set(postsWithUsers.map((p) => p.userId))];

      const profilesList = await ctx.db.query.profiles.findMany({
        where: (p, { inArray }) => inArray(p.id, userIds),
        columns: {
          id: true,
          defaultPostVisibility: true,
        },
      });

      const profileMap = new Map(
        profilesList.map((p) => [p.id, p.defaultPostVisibility]),
      );

      const followsList = await ctx.db.query.follows.findMany({
        where: (f, { and, eq, inArray }) =>
          and(
            eq(f.followerId, currentUserId),
            eq(f.accepted, true),
            inArray(f.followingId, userIds),
          ),
      });

      const followingSet = new Set(followsList.map((f) => f.followingId));

      const filteredPosts = postsWithUsers.filter((post) => {
        const visibility = profileMap.get(post.userId) ?? "public";

        if (post.userId === currentUserId) return true;
        if (visibility === "public") return true;
        if (visibility === "followers" && followingSet.has(post.userId))
          return true;

        return false;
      });

      return filteredPosts;
    }),
});
