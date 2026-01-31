/* eslint-disable */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { verifyLeetCodeSolution } from "~/server/services/leetcode";

export const problemRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      topicId: z.string(),
      leetcodeId: z.string(),
      title: z.string(),
      difficulty: z.string(),
      hyperlink: z.string(),
      tags: z.array(z.string()),
      orderIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.db.topic.findUnique({
        where: { id: input.topicId },
        include: { contest: true },
      });

      if (topic?.contest.creatorId !== input.userId) {
        throw new Error("Unauthorized");
      }

      return ctx.db.problem.create({
        data: input,
      });
    }),

  getByTopic: protectedProcedure
    .input(z.object({ userId: z.string(),  topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const topic = await ctx.db.topic.findUnique({
        where: { id: input.topicId },
        include: {
          contest: true,
        },
      });

      if (!topic) {
        throw new Error("Topic not found");
      }

      const problems = await ctx.db.problem.findMany({
        where: { topicId: input.topicId },
        include: {
          progress: {
            where: { userId: input.userId },
          },
        },
        orderBy: { orderIndex: "asc" },
      });

      // Get user progress for this topic
      const userProgress = await ctx.db.userProgress.findMany({
        where: {
          userId: input.userId,
          problem: { topicId: input.topicId },
        },
        include: { problem: true },
      });

      // Check if topic has started
      if (!topic.hasStarted || !topic.topicStartedAt) {
        // If topic hasn't started, lock all problems
        const problemsWithLockStatus = problems.map((problem) => ({
          ...problem,
          isLocked: true,
        }));
        return problemsWithLockStatus;
      }

      // Calculate days since topic started
      const startDate = new Date(topic.topicStartedAt);
      const now = new Date();
      // Set both dates to midnight for accurate day calculation
      startDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Group problems by difficulty
      const easyProblems = problems.filter(p => p.difficulty === "Easy");
      const mediumProblems = problems.filter(p => p.difficulty === "Medium");
      const hardProblems = problems.filter(p => p.difficulty === "Hard");

      // Count completed problems by difficulty
      const completedEasy = userProgress.filter(p => p.problem.difficulty === "Easy" && p.completed).length;
      const completedMedium = userProgress.filter(p => p.problem.difficulty === "Medium" && p.completed).length;

      // Calculate how many problems should be unlocked based on days and rate
      const easyPerDay = topic.contest.easyProblemsPerDay;
      const mediumPerDay = topic.contest.mediumProblemsPerDay;
      const hardDaysPerProblem = topic.contest.hardDaysPerProblem;

      // Easy problems unlock progressively
      const maxEasyUnlocked = Math.min(easyPerDay * (daysSinceStart + 1), easyProblems.length);
      
      // Medium problems start unlocking after all easy are completed
      const allEasyCompleted = completedEasy === easyProblems.length;
      const maxMediumUnlocked = allEasyCompleted 
        ? Math.min(mediumPerDay * (daysSinceStart + 1 - Math.ceil(easyProblems.length / easyPerDay)), mediumProblems.length)
        : 0;

      // Hard problems start unlocking after all medium are completed
      const allMediumCompleted = completedMedium === mediumProblems.length;
      const daysAfterMedium = allMediumCompleted 
        ? daysSinceStart + 1 - Math.ceil(easyProblems.length / easyPerDay) - Math.ceil(mediumProblems.length / mediumPerDay)
        : 0;
      const maxHardUnlocked = (allEasyCompleted && allMediumCompleted)
        ? Math.min(Math.floor(daysAfterMedium / hardDaysPerProblem), hardProblems.length)
        : 0;

      const problemsWithLockStatus = problems.map((problem, index) => {
        let isLocked = false;

        if (problem.difficulty === "Easy") {
          const easyIndex = easyProblems.findIndex(p => p.id === problem.id);
          isLocked = easyIndex >= maxEasyUnlocked;
        } else if (problem.difficulty === "Medium") {
          const mediumIndex = mediumProblems.findIndex(p => p.id === problem.id);
          isLocked = mediumIndex >= maxMediumUnlocked;
        } else if (problem.difficulty === "Hard") {
          const hardIndex = hardProblems.findIndex(p => p.id === problem.id);
          isLocked = hardIndex >= maxHardUnlocked;
        }

        return {
          ...problem,
          isLocked,
        };
      });

      return problemsWithLockStatus;
    }),

  verify: protectedProcedure
    .input(z.object({
      userId: z.string(),
      problemId: z.string(),
      leetcodeUsername: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.problem.findUnique({
        where: { id: input.problemId },
        include: { topic: true },
      });

      if (!problem) {
        throw new Error("Problem not found");
      }

      const isSolved = await verifyLeetCodeSolution(
        input.leetcodeUsername,
        problem.title
      );

      if (!isSolved) {
        throw new Error("Problem not solved on LeetCode");
      }

      const progress = await ctx.db.userProgress.upsert({
        where: {
          userId_problemId: {
            userId: input.userId,
            problemId: input.problemId,
          },
        },
        create: {
          userId: input.userId,
          topicId: problem.topicId,
          problemId: input.problemId,
          completed: true,
          completedAt: new Date(),
          verifiedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
          verifiedAt: new Date(),
        },
      });

      const participant = await ctx.db.contestParticipant.findFirst({
        where: { userId: input.userId },
      });

      if (participant && !participant.isVisible) {
        await ctx.db.contestParticipant.update({
          where: { id: participant.id },
          data: { isVisible: true },
        });
      }

      // Check if all problems unlocked today are now completed
      const topic = await ctx.db.topic.findUnique({
        where: { id: problem.topicId },
        include: { contest: true },
      });

      if (topic && topic.hasStarted && topic.topicStartedAt) {
        const startDate = new Date(topic.topicStartedAt);
        const now = new Date();
        startDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Get all problems for this topic
        const allProblems = await ctx.db.problem.findMany({
          where: { topicId: problem.topicId },
          orderBy: { orderIndex: "asc" },
        });

        const easyProblems = allProblems.filter(p => p.difficulty === "Easy");
        const mediumProblems = allProblems.filter(p => p.difficulty === "Medium");
        const hardProblems = allProblems.filter(p => p.difficulty === "Hard");

        // Calculate how many should be unlocked today
        const easyPerDay = topic.contest.easyProblemsPerDay;
        const mediumPerDay = topic.contest.mediumProblemsPerDay;
        const hardDaysPerProblem = topic.contest.hardDaysPerProblem;

        const maxEasyUnlocked = Math.min(easyPerDay * (daysSinceStart + 1), easyProblems.length);
        const unlockedEasyProblems = easyProblems.slice(0, maxEasyUnlocked);

        // Check completed easy problems
        const completedEasy = await ctx.db.userProgress.count({
          where: {
            userId: input.userId,
            problemId: { in: easyProblems.map(p => p.id) },
            completed: true,
          },
        });

        const allEasyCompleted = completedEasy === easyProblems.length;
        const maxMediumUnlocked = allEasyCompleted 
          ? Math.min(mediumPerDay * (daysSinceStart + 1 - Math.ceil(easyProblems.length / easyPerDay)), mediumProblems.length)
          : 0;
        const unlockedMediumProblems = mediumProblems.slice(0, maxMediumUnlocked);

        // Check completed medium problems
        const completedMedium = await ctx.db.userProgress.count({
          where: {
            userId: input.userId,
            problemId: { in: mediumProblems.map(p => p.id) },
            completed: true,
          },
        });

        const allMediumCompleted = completedMedium === mediumProblems.length;
        const daysAfterMedium = allMediumCompleted 
          ? daysSinceStart + 1 - Math.ceil(easyProblems.length / easyPerDay) - Math.ceil(mediumProblems.length / mediumPerDay)
          : 0;
        const maxHardUnlocked = (allEasyCompleted && allMediumCompleted)
          ? Math.min(Math.floor(daysAfterMedium / hardDaysPerProblem), hardProblems.length)
          : 0;
        const unlockedHardProblems = hardProblems.slice(0, maxHardUnlocked);

        // Get all unlocked problems for today
        const todaysUnlockedProblems = [...unlockedEasyProblems, ...unlockedMediumProblems, ...unlockedHardProblems];

        // Check how many of today's problems are completed
        const todaysCompletedCount = await ctx.db.userProgress.count({
          where: {
            userId: input.userId,
            problemId: { in: todaysUnlockedProblems.map(p => p.id) },
            completed: true,
          },
        });

        // Only update streak if ALL of today's problems are completed
        if (todaysCompletedCount === todaysUnlockedProblems.length && todaysUnlockedProblems.length > 0) {
          const existingStreak = await ctx.db.streak.findUnique({
            where: { userId: input.userId },
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check if already updated today
          const lastActive = existingStreak?.lastActiveAt ? new Date(existingStreak.lastActiveAt) : null;
          if (lastActive) {
            lastActive.setHours(0, 0, 0, 0);
          }

          const alreadyUpdatedToday = lastActive?.getTime() === today.getTime();

          if (!alreadyUpdatedToday) {
            await ctx.db.streak.upsert({
              where: { userId: input.userId },
              create: {
                userId: input.userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActiveAt: new Date(),
              },
              update: {
                currentStreak: { increment: 1 },
                longestStreak: { increment: 1 },
                lastActiveAt: new Date(),
              },
            });
          }
        }
      }

      return progress;
    }),

  getProgress: protectedProcedure
    .input(z.object({ userId: z.string(),  topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const total = await ctx.db.problem.count({
        where: { topicId: input.topicId },
      });

      const completed = await ctx.db.userProgress.count({
        where: {
          topicId: input.topicId,
          userId: input.userId,
          completed: true,
        },
      });

      return {
        total,
        completed,
        percentage: total > 0 ? (completed / total) * 100 : 0,
      };
    }),
});
