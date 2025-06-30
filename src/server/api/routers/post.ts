import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { comments, posts, userLikedPosts, users } from "~/server/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

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
              id: true,
              name: true,
              image: true,
            },
          },
          comments: {
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
                  // You can continue nesting if needed
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
            where: (comments, { isNull }) => isNull(comments.parentId), // Only top-level comments
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

      // Get like counts separately for performance
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
});
