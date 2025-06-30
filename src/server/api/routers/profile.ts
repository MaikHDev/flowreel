import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { profiles } from "~/server/db/schema";

export const profileRouter = createTRPCRouter({
  getCurrentProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.session.user.id),
      columns: {
        defaultPostVisibility: true,
      },
    });
    return profile;
  }),

  updatePostVisibility: protectedProcedure
    .input(z.object({ visibility: z.enum(["public", "followers", "private"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(profiles)
        .set({ defaultPostVisibility: input.visibility })
        .where(eq(profiles.id, ctx.session.user.id));
    }),
});
