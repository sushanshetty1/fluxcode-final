import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const topicRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      contestId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      subcategories: z.array(z.string()),
      questionsPerTopic: z.number().default(10),
      allowedLanguages: z.array(z.string()),
      difficulty: z.string().optional(),
      orderIndex: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
      });

      if (contest?.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.topic.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      subcategories: z.array(z.string()).optional(),
      questionsPerTopic: z.number().optional(),
      allowedLanguages: z.array(z.string()).optional(),
      difficulty: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const topic = await ctx.db.topic.findUnique({
        where: { id },
        include: { contest: true },
      });

      if (topic?.contest.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.topic.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.db.topic.findUnique({
        where: { id: input.id },
        include: { contest: true },
      });

      if (topic?.contest.creatorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.topic.delete({
        where: { id: input.id },
      });
    }),

  getByContest: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.topic.findMany({
        where: { contestId: input.contestId },
        include: {
          problems: {
            orderBy: { orderIndex: "asc" },
          },
          progress: {
            where: { userId: ctx.session.user.id },
          },
        },
        orderBy: { orderIndex: "asc" },
      });
    }),

  activateNext: protectedProcedure
    .input(z.object({ contestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentTopic = await ctx.db.topic.findFirst({
        where: {
          contestId: input.contestId,
          isActive: true,
        },
      });

      if (currentTopic) {
        await ctx.db.topic.update({
          where: { id: currentTopic.id },
          data: {
            isActive: false,
            topicCompletedAt: new Date(),
          },
        });
      }

      const nextTopic = await ctx.db.topic.findFirst({
        where: {
          contestId: input.contestId,
          isActive: false,
          topicCompletedAt: null,
        },
        orderBy: { orderIndex: "asc" },
      });

      if (nextTopic) {
        return ctx.db.topic.update({
          where: { id: nextTopic.id },
          data: { isActive: true },
        });
      }

      return null;
    }),
});
