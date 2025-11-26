import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
      linkedinUsername: z.string().optional(),
      leetcodeUsername: z.string().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session?.user?.id;
      if (!userId) {
        throw new Error("User ID required");
      }
      
      return ctx.db.user.update({
        where: { id: userId },
        data: {
          linkedinUsername: input.linkedinUsername,
          leetcodeUsername: input.leetcodeUsername,
          name: input.name,
          onboardingCompleted: true,
        },
      });
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          progress: {
            where: { completed: true },
            include: {
              problem: true,
              topic: true,
            },
          },
          streaks: true,
          achievements: {
            include: {
              badge: true,
            },
          },
          participations: {
            include: {
              contest: true,
            },
          },
        },
      });

      return user;
    }),

  getNotifications: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.notification.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });
    }),

  getAchievements: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.userAchievement.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: "desc" },
      });
    }),

  getStreak: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.streak.findUnique({
        where: { userId: ctx.session.user.id },
      });
    }),

  useStreakFreeze: protectedProcedure
    .mutation(async ({ ctx }) => {
      const streak = await ctx.db.streak.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!streak || streak.freezesLeft <= 0) {
        throw new Error("No freezes available");
      }

      return ctx.db.streak.update({
        where: { userId: ctx.session.user.id },
        data: {
          freezesLeft: { decrement: 1 },
          lastActiveAt: new Date(),
        },
      });
    }),
});
