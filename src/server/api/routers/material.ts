import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const materialRouter = createTRPCRouter({
  markComplete: protectedProcedure
    .input(
      z.object({
        contestId: z.string(),
        materialId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already completed
      const existing = await ctx.db.materialProgress.findUnique({
        where: {
          userId_contestId_materialId: {
            userId: input.userId,
            contestId: input.contestId,
            materialId: input.materialId,
          },
        },
      });

      if (existing?.completed) {
        return { success: true, alreadyCompleted: true };
      }

      // Mark as complete
      const progress = await ctx.db.materialProgress.upsert({
        where: {
          userId_contestId_materialId: {
            userId: input.userId,
            contestId: input.contestId,
            materialId: input.materialId,
          },
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
        create: {
          userId: input.userId,
          contestId: input.contestId,
          materialId: input.materialId,
          completed: true,
          completedAt: new Date(),
        },
      });

      // Award 5 points to the user
      await ctx.db.contestParticipant.updateMany({
        where: {
          userId: input.userId,
          contestId: input.contestId,
        },
        data: {
          points: {
            increment: 5,
          },
        },
      });

      return { success: true, progress };
    }),

  unmarkComplete: protectedProcedure
    .input(
      z.object({
        contestId: z.string(),
        materialId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.materialProgress.findUnique({
        where: {
          userId_contestId_materialId: {
            userId: input.userId,
            contestId: input.contestId,
            materialId: input.materialId,
          },
        },
      });

      if (!existing?.completed) {
        return { success: true };
      }

      // Unmark as complete
      await ctx.db.materialProgress.update({
        where: {
          userId_contestId_materialId: {
            userId: input.userId,
            contestId: input.contestId,
            materialId: input.materialId,
          },
        },
        data: {
          completed: false,
          completedAt: null,
        },
      });

      // Remove 5 points from the user
      await ctx.db.contestParticipant.updateMany({
        where: {
          userId: input.userId,
          contestId: input.contestId,
        },
        data: {
          points: {
            decrement: 5,
          },
        },
      });

      return { success: true };
    }),

  getProgress: publicProcedure
    .input(
      z.object({
        contestId: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.userId) return [];

      const progress = await ctx.db.materialProgress.findMany({
        where: {
          userId: input.userId,
          contestId: input.contestId,
        },
        select: {
          materialId: true,
          completed: true,
          completedAt: true,
        },
      });

      return progress;
    }),

  getStats: publicProcedure
    .input(
      z.object({
        contestId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const completedCount = await ctx.db.materialProgress.count({
        where: {
          userId: input.userId,
          contestId: input.contestId,
          completed: true,
        },
      });

      return {
        completed: completedCount,
        points: completedCount * 5,
      };
    }),
});
