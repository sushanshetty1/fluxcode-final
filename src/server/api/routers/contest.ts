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
      // Single optimized query with all necessary includes
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          creatorId: true,
          startDate: true,
          endDate: true,
          isActive: true,
          password: true,
          easyProblemsPerDay: true,
          mediumProblemsPerDay: true,
          hardDaysPerProblem: true,
          penaltyAmount: true,
          difficulty: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          topics: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              subcategories: true,
              questionsPerTopic: true,
              allowedLanguages: true,
              difficulty: true,
              orderIndex: true,
              isActive: true,
              hasStarted: true,
              topicStartedAt: true,
              topicCompletedAt: true,
              problems: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  leetcodeId: true,
                  title: true,
                  difficulty: true,
                  hyperlink: true,
                  tags: true,
                  orderIndex: true,
                  progress: input.userId ? {
                    where: { userId: input.userId },
                    select: {
                      id: true,
                      userId: true,
                      problemId: true,
                      completed: true,
                      completedAt: true,
                    },
                  } : false,
                },
              },
            },
          },
          participants: {
            select: {
              id: true,
              userId: true,
              joinedAt: true,
              role: true,
              isVisible: true,
              paymentStatus: true,
              currentStreak: true,
              lastPaymentDate: true,
              lastWeekendAttempt: true,
              lastWeekendSuccess: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  leetcodeUsername: true,
                },
              },
            },
          },
        },
      });

      if (!contest) return null;

      // Transform nested progress data to flat structure for easier consumption
      const userProgress = input.userId 
        ? contest.topics.flatMap(topic => 
            topic.problems.flatMap(problem => 
              problem.progress?.map(p => ({
                problemId: p.problemId,
                completed: p.completed,
                completedAt: p.completedAt,
                problem: {
                  leetcodeId: problem.leetcodeId,
                },
              })) ?? []
            )
          )
        : [];

      // Get all user progress (flattened from nested structure)
      const allUserProgress = contest.topics.flatMap(topic =>
        topic.problems.flatMap(problem =>
          problem.progress ?? []
        )
      );

      return {
        ...contest,
        userProgress,
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
      // Batch fetch all participants
      const participants = await ctx.db.contestParticipant.findMany({
        where: { contestId: input.contestId },
        select: {
          userId: true,
          paymentStatus: true,
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

      if (participants.length === 0) {
        return [];
      }

      const userIds = participants.map(p => p.userId);

      // Get today's date range (midnight to midnight)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Batch fetch all streaks for these users
      const streaks = await ctx.db.streak.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          currentStreak: true,
        },
      });

      // Batch fetch today's progress for all users
      const todayProgress = await ctx.db.userProgress.findMany({
        where: {
          userId: { in: userIds },
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
        select: {
          userId: true,
          problem: {
            select: {
              leetcodeId: true,
            },
          },
        },
      });

      // Build maps for O(1) lookups
      const streakMap = new Map(streaks.map(s => [s.userId, s.currentStreak]));
      const progressMap = new Map<string, string[]>();
      
      for (const progress of todayProgress) {
        const existing = progressMap.get(progress.userId) ?? [];
        existing.push(progress.problem.leetcodeId);
        progressMap.set(progress.userId, existing);
      }

      // Build leaderboard data
      const leaderboardData = participants.map(participant => ({
        userId: participant.userId,
        name: participant.user.name,
        image: participant.user.image,
        leetcodeUsername: participant.user.leetcodeUsername,
        currentStreak: streakMap.get(participant.userId) ?? 0,
        problemsSolvedToday: progressMap.get(participant.userId) ?? [],
        paymentStatus: participant.paymentStatus,
      }));

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
    .input(z.object({ contestId: z.string(), userId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      
      // Optimized query with select to limit fields
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        select: {
          id: true,
          participants: {
            where: input.userId ? { userId: input.userId } : undefined,
            select: {
              id: true,
              userId: true,
              lastWeekendSuccess: true,
              lastPaymentDate: true,
              paymentStatus: true,
            },
          },
        },
      });

      if (!contest) {
        throw new Error("Contest not found");
      }

      // Check each participant's weekend test completion
      const today = new Date();
      const updates = [];

      for (const participant of contest.participants) {
        // Check if they've already paid the penalty this week
        const lastPaymentDate = participant.lastPaymentDate;
        const hasRecentPayment = lastPaymentDate && 
          Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) < 7;

        // Only mark as pending if:
        // 1. They didn't pass the weekend test AND
        // 2. They haven't paid the penalty in the last 7 days
        if (!participant.lastWeekendSuccess && !hasRecentPayment && participant.paymentStatus !== "pending") {
          updates.push(
            ctx.db.contestParticipant.update({
              where: { id: participant.id },
              data: {
                paymentStatus: "pending",
                currentStreak: 0,
              },
            })
          );
        }
      }

      // Batch execute all updates
      if (updates.length > 0) {
        await Promise.all(updates);
      }

      return { message: "Penalty check completed", updated: updates.length };
    }),

  getTotalRevenue: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all completed payments for this contest
      const payments = await ctx.db.payment.findMany({
        where: {
          contestId: input.contestId,
          status: "completed",
        },
        select: {
          amount: true,
        },
      });

      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      return { totalRevenue };
    }),
});
