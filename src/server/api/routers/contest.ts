import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { fetchLeetCodeProblems } from "~/server/services/leetcode";

export const contestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contest.create({
        data: {
          ...input,
          creatorId: ctx.session.user.id,
        },
      });
    }),

  createWithTopics: protectedProcedure
    .input(z.object({
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
          creatorId: ctx.session.user.id,
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
          userId: ctx.session.user.id,
          role: "creator",
          isVisible: true,
        },
      });

      return contest;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
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
      if (ctx.session?.user?.id) {
        userProgress = await ctx.db.userProgress.findMany({
          where: {
            userId: ctx.session.user.id,
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
    .query(async ({ ctx }) => {
      const participation = await ctx.db.contestParticipant.findFirst({
        where: { userId: ctx.session.user.id },
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

  update: protectedProcedure
    .input(z.object({
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
      
      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.contest.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.id },
      });
      
      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.contest.delete({
        where: { id: input.id },
      });
    }),

  join: protectedProcedure
    .input(z.object({ 
      contestId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.contestParticipant.findFirst({
        where: { userId: ctx.session.user.id },
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
          userId: ctx.session.user.id,
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contestParticipant.deleteMany({
        where: {
          contestId: input.contestId,
          userId: ctx.session.user.id,
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
});
