import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { verifyLeetCodeSolution } from "~/server/services/leetcode";
import type { PrismaClient } from "@prisma/client";

// Helper function to update streak
async function updateStreak(db: PrismaClient, userId: string, contestId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get or create streak record for user
  let streak = await db.streak.findUnique({
    where: { userId },
  });

  if (!streak) {
    streak = await db.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveAt: now,
      },
    });
  } else {
    const lastActive = new Date(streak.lastActiveAt);
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    
    // Calculate days difference
    const daysDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day - just update lastActiveAt, don't increment streak
      await db.streak.update({
        where: { userId },
        data: { lastActiveAt: now },
      });
    } else if (daysDiff === 1) {
      // Next day - increment streak
      const newStreak = streak.currentStreak + 1;
      await db.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActiveAt: now,
        },
      });
    } else {
      // Missed days - reset streak to 1
      await db.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak.longestStreak),
          lastActiveAt: now,
        },
      });
    }
  }

  // Also update ContestParticipant streak
  const participant = await db.contestParticipant.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
  });

  if (participant) {
    const streak = await db.streak.findUnique({ where: { userId } });
    await db.contestParticipant.update({
      where: {
        contestId_userId: {
          contestId,
          userId,
        },
      },
      data: {
        currentStreak: streak?.currentStreak ?? 0,
      },
    });
  }
}

// Helper function to update weekend test status
async function updateWeekendTestStatus(db: PrismaClient, userId: string, contestId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Only track weekend tests on Saturday (6) and Sunday (0)
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    return;
  }

  // Get the contest participant
  const participant = await db.contestParticipant.findUnique({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
  });

  if (!participant) {
    return;
  }

  // Get all weekend problems for this contest from UserProgress
  // Weekend problems are identified by their title pattern or we need to fetch from contest syllabus
  // For now, we'll count all problems solved during the current weekend
  
  // Get start of current weekend (Saturday)
  const currentSaturday = new Date(now);
  currentSaturday.setDate(now.getDate() - (dayOfWeek === 0 ? 1 : dayOfWeek - 6));
  currentSaturday.setHours(0, 0, 0, 0);
  
  // Get end of current weekend (Sunday end)
  const currentSundayEnd = new Date(currentSaturday);
  currentSundayEnd.setDate(currentSaturday.getDate() + 2);
  currentSundayEnd.setHours(23, 59, 59, 999);

  // Count problems solved this weekend
  const weekendProblemsCount = await db.userProgress.count({
    where: {
      userId,
      topic: {
        contestId,
      },
      completed: true,
      completedAt: {
        gte: currentSaturday,
        lte: currentSundayEnd,
      },
    },
  });

  // Update participant's weekend test status
  // Success = solved 2 or 3 problems, Failure = 0 or 1 problem
  const lastWeekendSuccess = weekendProblemsCount >= 2;
  
  await db.contestParticipant.update({
    where: {
      contestId_userId: {
        contestId,
        userId,
      },
    },
    data: {
      lastWeekendAttempt: now,
      lastWeekendSuccess,
    },
  });
}

// Helper function to award points for completing problems
async function awardPoints(db: PrismaClient, userId: string, contestId: string, _problemId: string) {
  // Get contest to access syllabus (we'll determine if homework or weekend based on problemId)
  // For now, we'll award points based on a simple rule:
  // - Homework problems: 10 points
  // - Weekend problems: 20 points
  // We'll identify weekend problems by checking if they're solved on weekends
  
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Award 20 points for weekend problems, 10 for homework
  const points = isWeekend ? 20 : 10;
  
  await db.contestParticipant.updateMany({
    where: {
      userId,
      contestId,
    },
    data: {
      points: {
        increment: points,
      },
    },
  });
}

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

      let streak = await ctx.db.streak.findUnique({
        where: { userId: input.userId },
      });

      // Check if user missed a day and reset streak if so
      if (streak) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastActive = new Date(streak.lastActiveAt);
        const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        
        const daysDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
        
        // If more than 1 day has passed, reset streak to 0
        if (daysDiff > 1) {
          streak = await ctx.db.streak.update({
            where: { userId: input.userId },
            data: {
              currentStreak: 0,
              lastActiveAt: now,
            },
          });
        }
      }

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
        titleSlug: z.string().optional(), // Actual LeetCode titleSlug from JSON
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

      // Verify with LeetCode API using titleSlug if available, otherwise problem title
      const isSolved = await verifyLeetCodeSolution(user.leetcodeUsername, input.problemTitle, input.titleSlug);

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
      topic ??= await ctx.db.topic.create({
          data: {
            contestId: input.contestId,
            name: "Contest Problems",
            orderIndex: 0,
            allowedLanguages: ["javascript", "python", "java", "cpp"],
          },
        });

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
        const result = await ctx.db.userProgress.update({
          where: { id: existing.id },
          data: {
            completed: true,
            completedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
        
        // Update streak
        await updateStreak(ctx.db, input.userId, input.contestId);
        
        // Check if this is a weekend problem and update weekend test tracking
        await updateWeekendTestStatus(ctx.db, input.userId, input.contestId);
        
        return result;
      }

      // Create new progress
      const result = await ctx.db.userProgress.create({
        data: {
          userId: input.userId,
          problemId: problem.id,
          topicId: topic.id,
          completed: true,
          completedAt: new Date(),
          verifiedAt: new Date(),
        },
      });
      
      // Update streak
      await updateStreak(ctx.db, input.userId, input.contestId);
      
      // Check if this is a weekend problem and update weekend test tracking
      await updateWeekendTestStatus(ctx.db, input.userId, input.contestId);
      
      // Award points for problem completion
      await awardPoints(ctx.db, input.userId, input.contestId, input.problemId);
      
      return result;
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
