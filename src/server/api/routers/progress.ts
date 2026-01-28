import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { verifyLeetCodeSolution } from "~/server/services/leetcode";

export const progressRouter = createTRPCRouter({
  getUserProgress: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const progress = await ctx.db.userProgress.findMany({
        where: {
          userId: input.userId,
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
    .input(z.object({ userId: z.string(),  topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userProgress.findMany({
        where: {
          userId: input.userId,
          topicId: input.topicId,
        },
        include: {
          problem: true,
        },
        orderBy: { completedAt: "desc" },
      });
    }),

  getStats: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const totalSolved = await ctx.db.userProgress.count({
        where: {
          userId: input.userId,
          completed: true,
        },
      });

      const byDifficulty = await ctx.db.userProgress.groupBy({
        by: ["problemId"],
        where: {
          userId: input.userId,
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
          userId: input.userId,
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
        where: { userId: input.userId },
      });

      return {
        totalSolved,
        difficultyCount,
        topicStats,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      };
    }),

  markContestProblemCompleted: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        contestId: z.string(),
        problemId: z.string(), // LeetCode problem ID from syllabus (e.g., "1", "26")
        problemTitle: z.string(), // Problem title for display
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's LeetCode username
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { leetcodeUsername: true },
      });

      if (!user?.leetcodeUsername) {
        throw new Error("LeetCode username not found. Please complete onboarding.");
      }

      // Verify with LeetCode API using problem ID (e.g., "1", "26")
      const isSolved = await verifyLeetCodeSolution(user.leetcodeUsername, input.problemId);

      if (!isSolved) {
        throw new Error(`Problem not solved on LeetCode. Please solve "${input.problemTitle}" and try again.`);
      }

      // Problem is verified, proceed with marking as completed
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        include: { topics: true },
      });

      if (!contest) {
        throw new Error("Contest not found");
      }

      // Get or create a default topic for this contest
      let topic = contest.topics[0];
      if (!topic) {
        topic = await ctx.db.topic.create({
          data: {
            contestId: input.contestId,
            name: "Contest Problems",
            orderIndex: 0,
            allowedLanguages: ["javascript", "python", "java", "cpp"],
          },
        });
      }

      // Find or create problem record
      let problem = await ctx.db.problem.findFirst({
        where: {
          leetcodeId: input.problemId,
          topicId: topic.id,
        },
      });

      if (!problem) {
        // Convert title to slug for hyperlink
        const titleSlug = input.problemTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        // Create a placeholder problem record
        problem = await ctx.db.problem.create({
          data: {
            topicId: topic.id,
            leetcodeId: input.problemId,
            title: input.problemTitle,
            difficulty: "Medium", // Default
            hyperlink: `https://leetcode.com/problems/${titleSlug}/`,
            tags: [],
            orderIndex: 0,
          },
        });
      }

      // Check if progress record exists
      const existing = await ctx.db.userProgress.findUnique({
        where: {
          userId_problemId: {
            userId: input.userId,
            problemId: problem.id,
          },
        },
      });

      if (existing) {
        return ctx.db.userProgress.update({
          where: { id: existing.id },
          data: {
            completed: true,
            completedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
      }

      // Create new progress
      return ctx.db.userProgress.create({
        data: {
          userId: input.userId,
          problemId: problem.id,
          topicId: topic.id,
          completed: true,
          completedAt: new Date(),
          verifiedAt: new Date(),
        },
      });
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ userId: z.string(),  limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userProgress.findMany({
        where: {
          userId: input.userId,
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
