import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const progressRouter = createTRPCRouter({
  getUserProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const progress = await ctx.db.userProgress.findMany({
        where: {
          userId: ctx.session.user.id,
          completed: true,
        },
        include: {
          topic: true,
          problem: true,
        },
        orderBy: { completedAt: "desc" },
      });

      return progress;
    }),

  getProgressByTopic: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userProgress.findMany({
        where: {
          userId: ctx.session.user.id,
          topicId: input.topicId,
        },
        include: {
          problem: true,
        },
        orderBy: { completedAt: "desc" },
      });
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalSolved = await ctx.db.userProgress.count({
        where: {
          userId: ctx.session.user.id,
          completed: true,
        },
      });

      const byDifficulty = await ctx.db.userProgress.groupBy({
        by: ["problemId"],
        where: {
          userId: ctx.session.user.id,
          completed: true,
        },
        _count: true,
      });

      const problems = await ctx.db.problem.findMany({
        where: {
          id: { in: byDifficulty.map((p) => p.problemId) },
        },
      });

      const difficultyCount = problems.reduce((acc, problem) => {
        acc[problem.difficulty] = (acc[problem.difficulty] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topicProgress = await ctx.db.userProgress.groupBy({
        by: ["topicId"],
        where: {
          userId: ctx.session.user.id,
          completed: true,
        },
        _count: true,
      });

      const topics = await ctx.db.topic.findMany({
        where: {
          id: { in: topicProgress.map((t) => t.topicId) },
        },
      });

      const topicStats = topicProgress.map((tp) => {
        const topic = topics.find((t) => t.id === tp.topicId);
        return {
          topicName: topic?.name ?? "Unknown",
          count: tp._count,
        };
      });

      const streak = await ctx.db.streak.findUnique({
        where: { userId: ctx.session.user.id },
      });

      return {
        totalSolved,
        difficultyCount,
        topicStats,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      };
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userProgress.findMany({
        where: {
          userId: ctx.session.user.id,
          completed: true,
        },
        include: {
          problem: true,
          topic: true,
        },
        orderBy: { completedAt: "desc" },
        take: input.limit,
      });
    }),
});
