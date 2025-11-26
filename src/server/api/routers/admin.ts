import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateDailySuggestion } from "~/server/services/openai";
import { fetchLeetCodeProblems } from "~/server/services/leetcode";
import { sendMissedProblemNotification } from "~/server/services/email";

export const adminRouter = createTRPCRouter({
  startNextTopic: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        include: {
          topics: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!contest || contest.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Find current active topic
      const currentTopic = contest.topics.find((t) => t.isActive);
      
      // If no active topic, start the first topic
      if (!currentTopic) {
        const firstTopic = contest.topics[0];
        if (!firstTopic) {
          throw new Error("No topics found");
        }

        await ctx.db.topic.update({
          where: { id: firstTopic.id },
          data: {
            isActive: true,
            hasStarted: true,
            topicStartedAt: new Date(),
          },
        });

        return firstTopic;
      }

      // Check if all problems in current topic are solved by checking if any user has unlocked but not completed problems
      const currentTopicProblems = await ctx.db.problem.findMany({
        where: { topicId: currentTopic.id },
      });

      const participants = await ctx.db.contestParticipant.findMany({
        where: { contestId: input.contestId },
      });

      // Mark unsolved problems as missed for all participants
      for (const participant of participants) {
        const userProgress = await ctx.db.userProgress.findMany({
          where: {
            userId: participant.userId,
            topicId: currentTopic.id,
          },
        });

        const solvedProblemIds = userProgress.filter(p => p.completed).map(p => p.problemId);
        const unsolvedProblems = currentTopicProblems.filter(p => !solvedProblemIds.includes(p.id));

        // Mark unsolved problems as missed and send email notifications
        for (const problem of unsolvedProblems) {
          await ctx.db.userProgress.upsert({
            where: {
              userId_problemId: {
                userId: participant.userId,
                problemId: problem.id,
              },
            },
            create: {
              userId: participant.userId,
              topicId: currentTopic.id,
              problemId: problem.id,
              completed: false,
              isMissed: true,
            },
            update: {
              isMissed: true,
            },
          });

          // Send email notification for missed problem
          const user = await ctx.db.user.findUnique({
            where: { id: participant.userId },
          });

          if (user?.email) {
            try {
              await sendMissedProblemNotification(user.email, {
                name: user.name ?? "User",
                problemTitle: problem.title,
                problemUrl: problem.hyperlink,
                topicName: currentTopic.name,
                contestName: contest.name,
              });
            } catch (error) {
              console.error(`Failed to send missed problem email to ${user.email}:`, error);
            }
          }
        }
      }

      // Mark current topic as completed
      await ctx.db.topic.update({
        where: { id: currentTopic.id },
        data: {
          isActive: false,
          hasStarted: true,
          topicCompletedAt: new Date(),
        },
      });

      // Find and activate next topic
      const nextTopic = contest.topics.find(
        (t) => t.orderIndex === currentTopic.orderIndex + 1
      );

      if (!nextTopic) {
        throw new Error("No more topics to activate");
      }

      await ctx.db.topic.update({
        where: { id: nextTopic.id },
        data: {
          isActive: true,
          hasStarted: true,
          topicStartedAt: new Date(),
        },
      });

      return nextTopic;
    }),

  canStartNextTopic: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        include: {
          topics: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!contest) {
        return { canStart: false, reason: "Contest not found" };
      }

      // Find current active topic
      const currentTopic = contest.topics.find((t) => t.isActive);
      
      // If no active topic, can start the first topic
      if (!currentTopic) {
        return { canStart: true, reason: "No active topic - ready to start first topic" };
      }

      // Get all problems in current topic
      const currentTopicProblems = await ctx.db.problem.findMany({
        where: { topicId: currentTopic.id },
      });

      // Get all participants
      const participants = await ctx.db.contestParticipant.findMany({
        where: { contestId: input.contestId },
      });

      if (participants.length === 0) {
        return { canStart: false, reason: "No participants in contest" };
      }

      // Check if ALL participants have completed ALL problems
      for (const participant of participants) {
        const completedProblems = await ctx.db.userProgress.count({
          where: {
            userId: participant.userId,
            problemId: { in: currentTopicProblems.map(p => p.id) },
            completed: true,
          },
        });

        if (completedProblems < currentTopicProblems.length) {
          // Check if the requesting user (creator) is the one who hasn't completed
          if (participant.userId === ctx.session.user.id) {
            return { canStart: false, reason: "You must complete all problems first" };
          }
          return { canStart: false, reason: "Not all participants have completed all problems" };
        }
      }

      // Check if there's a next topic
      const nextTopic = contest.topics.find(
        (t) => t.orderIndex === currentTopic.orderIndex + 1
      );

      if (!nextTopic) {
        return { canStart: false, reason: "No more topics available" };
      }

      return { canStart: true, reason: "All participants completed all problems" };
    }),

  getDailySuggestions: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dailySuggestion.findMany({
        where: { contestId: input.contestId },
        orderBy: { createdAt: "desc" },
      });
    }),

  generateDailySuggestion: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        include: {
          topics: {
            where: { isActive: false, topicCompletedAt: null },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const completedTopics = await ctx.db.topic.findMany({
        where: {
          contestId: input.contestId,
          topicCompletedAt: { not: null },
        },
      });

      const suggestion = await generateDailySuggestion(
        completedTopics.map((t: { name: string }) => t.name)
      );

      return ctx.db.dailySuggestion.create({
        data: {
          contestId: input.contestId,
          ...suggestion,
        },
      });
    }),

  applySuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await ctx.db.dailySuggestion.findUnique({
        where: { id: input.suggestionId },
        include: { 
          contest: {
            include: {
              topics: {
                take: 1,
                orderBy: { orderIndex: "asc" }
              }
            }
          }
        },
      });

      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      if (suggestion.contest.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const topicCount = await ctx.db.topic.count({
        where: { contestId: suggestion.contestId },
      });

      const topic = await ctx.db.topic.create({
        data: {
          contestId: suggestion.contestId,
          name: suggestion.topicName,
          subcategories: suggestion.subcategories,
          difficulty: suggestion.difficulty,
          questionsPerTopic: 10,
          allowedLanguages: suggestion.contest.topics[0]?.allowedLanguages ?? ["Java", "Python", "C++"],
          orderIndex: topicCount,
        },
      });

      const problems = await fetchLeetCodeProblems({
        tags: suggestion.subcategories,
        difficulty: {
          easy: 3,
          medium: 5,
          hard: 2,
        },
        limit: 10,
      });

      await Promise.all(
        problems.map((problem: { questionFrontendId: string; title: string; titleSlug: string; difficulty: string; topicTags: Array<{ name: string }> }, index: number) =>
          ctx.db.problem.create({
            data: {
              topicId: topic.id,
              leetcodeId: problem.questionFrontendId,
              title: problem.title,
              difficulty: problem.difficulty,
              hyperlink: `https://leetcode.com/problems/${problem.titleSlug}`,
              tags: problem.topicTags.map(t => t.name),
              orderIndex: index,
            },
          })
        )
      );

      await ctx.db.dailySuggestion.update({
        where: { id: input.suggestionId },
        data: { isApplied: true },
      });

      return topic;
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
      });

      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const topics = await ctx.db.topic.findMany({
        where: { contestId: input.contestId },
        include: {
          problems: true,
          progress: {
            where: { completed: true },
          },
        },
      });

      const analytics = topics.map((topic: { name: string; difficulty: string | null; problems: unknown[]; progress: unknown[] }) => {
        const totalProblems = topic.problems.length;
        const totalAttempts = topic.progress.length;
        const solveRate = totalProblems > 0 ? (totalAttempts / totalProblems) * 100 : 0;

        return {
          topicName: topic.name,
          difficulty: topic.difficulty,
          totalProblems,
          totalAttempts,
          solveRate,
        };
      });

      return analytics;
    }),

  createAnnouncement: protectedProcedure
    .input(z.object({
      contestId: z.string(),
      title: z.string(),
      content: z.string(),
      priority: z.enum(["low", "normal", "high"]).default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
      });

      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const announcement = await ctx.db.announcement.create({
        data: input,
      });

      const participants = await ctx.db.contestParticipant.findMany({
        where: { contestId: input.contestId },
      });

      await Promise.all(
        participants.map((p: { userId: string }) =>
          ctx.db.notification.create({
            data: {
              userId: p.userId,
              title: input.title,
              message: input.content,
              type: "announcement",
            },
          })
        )
      );

      return announcement;
    }),

  moderateDispute: protectedProcedure
    .input(z.object({
      userId: z.string(),
      problemId: z.string(),
      action: z.enum(["approve", "reject"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const progress = await ctx.db.userProgress.findUnique({
        where: {
          userId_problemId: {
            userId: input.userId,
            problemId: input.problemId,
          },
        },
        include: {
          topic: {
            include: { contest: true },
          },
        },
      });

      if (progress?.topic.contest.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      if (input.action === "approve") {
        return ctx.db.userProgress.update({
          where: {
            userId_problemId: {
              userId: input.userId,
              problemId: input.problemId,
            },
          },
          data: {
            completed: true,
            verifiedAt: new Date(),
          },
        });
      } else {
        return ctx.db.userProgress.delete({
          where: {
            userId_problemId: {
              userId: input.userId,
              problemId: input.problemId,
            },
          },
        });
      }
    }),

  testEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.email) {
        throw new Error("User email not found");
      }

      try {
        await sendMissedProblemNotification(user.email, {
          name: user.name ?? "User",
          problemTitle: "Two Sum",
          problemUrl: "https://leetcode.com/problems/two-sum",
          topicName: "Arrays and Hashing",
          contestName: "Test Contest",
        });
        return { success: true, message: `Test email sent to ${user.email}` };
      } catch (error) {
        console.error("Test email error:", error);
        throw new Error(`Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
