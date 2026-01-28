import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { fetchLeetCodeProblems } from "~/server/services/leetcode";

export const contestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contest.create({
        data: {
          ...input,
          creatorId: input.userId,
        },
      });
    }),

  createWithTopics: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      startDate: z.date(),
      password: z.string().optional(),
      easyProblemsPerDay: z.number().default(2),
      mediumProblemsPerDay: z.number().default(1),
      hardDaysPerProblem: z.number().default(2),
      topics: z.array(z.object({
        name: z.string(),
        description: z.string(),
        subcategories: z.array(z.string()),
        questionsPerTopic: z.number(),
        difficulty: z.string(),
        easy: z.number(),
        medium: z.number(),
        hard: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          password: input.password,
          easyProblemsPerDay: input.easyProblemsPerDay,
          mediumProblemsPerDay: input.mediumProblemsPerDay,
          hardDaysPerProblem: input.hardDaysPerProblem,
          creatorId: input.userId,
        },
      });

      // Create topics and fetch problems
      for (let i = 0; i < input.topics.length; i++) {
        const topicInput = input.topics[i]!;
        
        const topic = await ctx.db.topic.create({
          data: {
            contestId: contest.id,
            name: topicInput.name,
            description: topicInput.description,
            subcategories: topicInput.subcategories,
            questionsPerTopic: topicInput.questionsPerTopic,
            allowedLanguages: ["JavaScript", "Python", "Java", "C++"],
            difficulty: topicInput.difficulty,
            orderIndex: i,
            isActive: false, // Topics require manual start by creator
            hasStarted: false,
            topicStartedAt: null,
          },
        });

        // Fetch problems from LeetCode
        try {
          const problems = await fetchLeetCodeProblems({
            tags: topicInput.subcategories,
            difficulty: {
              easy: topicInput.easy,
              medium: topicInput.medium,
              hard: topicInput.hard,
            },
            limit: topicInput.questionsPerTopic,
          });

          // Create problems
          for (let j = 0; j < problems.length; j++) {
            const problem = problems[j]!;
            await ctx.db.problem.create({
              data: {
                topicId: topic.id,
                leetcodeId: problem.questionFrontendId,
                title: problem.title,
                difficulty: problem.difficulty,
                hyperlink: `https://leetcode.com/problems/${problem.titleSlug}`,
                tags: problem.topicTags.map((t: { name: string }) => t.name),
                orderIndex: j,
              },
            });
          }
        } catch (error) {
          console.error(`Failed to fetch problems for topic ${topicInput.name}:`, error);
        }
      }

      // Auto-join creator as participant
      await ctx.db.contestParticipant.create({
        data: {
          contestId: contest.id,
          userId: input.userId,
          role: "creator",
          isVisible: true,
        },
      });

      return contest;
    }),

  getById: publicProcedure
    .input(z.object({ userId: z.string().optional(),  id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.id },
        include: {
          creator: true,
          topics: {
            orderBy: { orderIndex: "asc" },
            include: {
              problems: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!contest) return null;

      // Get all user progress for the contest
      const allUserProgress = await ctx.db.userProgress.findMany({
        where: {
          problem: {
            topic: {
              contestId: input.id,
            },
          },
        },
      });

      // Get user progress if authenticated
      let userProgress = null;
      if (input.userId) {
        userProgress = await ctx.db.userProgress.findMany({
          where: {
            userId: input.userId,
            problem: {
              topic: {
                contestId: input.id,
              },
            },
          },
          select: {
            problemId: true,
            completed: true,
            completedAt: true,
            problem: {
              select: {
                leetcodeId: true,
              },
            },
          },
        });
      }

      return {
        ...contest,
        userProgress: userProgress ?? [],
        allUserProgress,
      };
    }),

  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.contest.findMany({
        where: { isActive: true },
        include: {
          creator: true,
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getUserContest: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participation = await ctx.db.contestParticipant.findFirst({
        where: { userId: input.userId },
        include: {
          contest: {
            include: {
              creator: true,
              topics: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });
      return participation?.contest;
    }),

  getLeaderboard: publicProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.contestParticipant.findMany({
        where: { contestId: input.contestId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              leetcodeUsername: true,
            },
          },
        },
      });

      // Get today's date range (midnight to midnight)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const leaderboardData = await Promise.all(
        participants.map(async (participant) => {
          // Get user's streak
          const streak = await ctx.db.streak.findUnique({
            where: { userId: participant.userId },
          });

          // Get today's solved problems
          const todayProgress = await ctx.db.userProgress.findMany({
            where: {
              userId: participant.userId,
              completedAt: {
                gte: todayStart,
                lt: todayEnd,
              },
              completed: true,
              problem: {
                topic: {
                  contestId: input.contestId,
                },
              },
            },
            include: {
              problem: {
                select: {
                  leetcodeId: true,
                },
              },
            },
          });

          const problemsSolvedToday = todayProgress.map(p => p.problem.leetcodeId);

          return {
            userId: participant.userId,
            name: participant.user.name,
            image: participant.user.image,
            leetcodeUsername: participant.user.leetcodeUsername,
            currentStreak: streak?.currentStreak ?? 0,
            problemsSolvedToday,
            needsPayment: participant.needsPayment,
            hasPaid: participant.hasPaid,
          };
        })
      );

      return leaderboardData;
    }),

  update: protectedProcedure
    .input(z.object({
      userId: z.string(),
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      endDate: z.date().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const contest = await ctx.db.contest.findUnique({
        where: { id },
      });
      
      if (contest?.creatorId !== input.userId) {
        throw new Error("Unauthorized");
      }

      return ctx.db.contest.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ userId: z.string(),  id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.id },
      });
      
      if (contest?.creatorId !== input.userId) {
        throw new Error("Unauthorized");
      }

      return ctx.db.contest.delete({
        where: { id: input.id },
      });
    }),

  join: protectedProcedure
    .input(z.object({ 
      userId: z.string(),
      contestId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contestParticipant.findFirst({
        where: { userId: input.userId },
      });

      if (existing) {
        throw new Error("You are already in a contest");
      }

      // Check if contest requires password
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
      });

      if (!contest) {
        throw new Error("Contest not found");
      }

      if (contest.password && contest.password !== input.password) {
        throw new Error("Incorrect password");
      }

      return ctx.db.contestParticipant.create({
        data: {
          contestId: input.contestId,
          userId: input.userId,
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ userId: z.string(),  contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contestParticipant.deleteMany({
        where: {
          contestId: input.contestId,
          userId: input.userId,
        },
      });
    }),

  getParticipants: publicProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contestParticipant.findMany({
        where: { 
          contestId: input.contestId,
          isVisible: true,
        },
        include: {
          user: {
            include: {
              progress: {
                where: {
                  completed: true,
                },
              },
              streaks: true,
            },
          },
        },
      });
    }),

  createWithDifficulty: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      difficulty: z.string(),
      startDate: z.date(),
      penaltyAmount: z.number(),
      invitedUserIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create contest
      const contest = await ctx.db.contest.create({
        data: {
          name: input.name,
          description: input.description,
          difficulty: input.difficulty,
          startDate: input.startDate,
          penaltyAmount: input.penaltyAmount,
          creatorId: input.userId,
          isActive: true,
        },
      });

      // Add creator as participant
      await ctx.db.contestParticipant.create({
        data: {
          contestId: contest.id,
          userId: input.userId,
          role: "creator",
          isVisible: true,
        },
      });

      // Invite users if provided
      if (input.invitedUserIds && input.invitedUserIds.length > 0) {
        // Filter out creator to avoid duplicate
        const usersToInvite = input.invitedUserIds.filter(id => id !== input.userId);
        
        if (usersToInvite.length > 0) {
          await ctx.db.contestParticipant.createMany({
            data: usersToInvite.map((userId) => ({
              contestId: contest.id,
              userId,
              role: "participant",
              isVisible: false,
            })),
          });
        }
      }

      return contest;
    }),

  checkWeekendPenalties: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if it's Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      if (dayOfWeek !== 1) {
        throw new Error("Penalty checks only run on Mondays");
      }

      // Get contest
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!contest) {
        throw new Error("Contest not found");
      }

      // Check each participant's weekend test completion
      for (const participant of contest.participants) {
        // Skip if already paid this week
        const lastPaymentDate = participant.lastPaymentDate;
        if (lastPaymentDate) {
          const daysSincePayment = Math.floor(
            (today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSincePayment < 7) {
            continue;
          }
        }

        // Check weekend problems completion (requires 2/3 solved)
        const lastWeekendAttempt = participant.lastWeekendAttempt;
        const lastWeekendSuccess = participant.lastWeekendSuccess;

        if (!lastWeekendSuccess && lastWeekendAttempt) {
          // Failed weekend test (0-1 solved) - mark for penalty payment
          await ctx.db.contestParticipant.update({
            where: { id: participant.id },
            data: {
              needsPayment: true,
              currentStreak: 0,
              hasPaid: false,
            },
          });
        } else if (lastWeekendSuccess) {
          // Passed weekend test (2-3 solved) - money carries over, no payment needed
          await ctx.db.contestParticipant.update({
            where: { id: participant.id },
            data: {
              currentStreak: { increment: 1 },
              needsPayment: false,
              hasPaid: true,
            },
          });
        }
      }

      return { message: "Penalty check completed" };
    }),
});
