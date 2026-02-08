import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const leaderboardRouter = createTRPCRouter({
  getByContest: publicProcedure
    .input(z.object({ contestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contest = await ctx.db.contest.findUnique({
        where: { id: input.contestId },
        select: {
          difficulty: true,
          startDate: true,
        },
      });

      if (!contest) {
        throw new Error("Contest not found");
      }

      // Calculate current week number
      const now = new Date();
      const startDate = new Date(contest.startDate);
      const weeksSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeekNumber = weeksSinceStart + 1;

      // Load syllabus to get weekend problem IDs
      let weekendProblemIds: string[] = [];
      try {
        const syllabusMap: Record<string, string> = {
          'beginner': 'beginner-9months.json',
          'intermediate': 'intermediate-6months.json',
          'advanced': 'advanced-5months.json',
        };
        const syllabusFile = syllabusMap[contest.difficulty];
        
        if (syllabusFile) {
          const syllabus = await import(`../../../../public/syllabi/${syllabusFile}`) as {
            weeks: Array<{
              weekNumber: number;
              weekendTest?: {
                problems: Array<{ id: string }>;
              };
            }>;
          };
          
          const currentWeekData = syllabus.weeks.find((w) => w.weekNumber === currentWeekNumber);
          if (currentWeekData?.weekendTest) {
            weekendProblemIds = currentWeekData.weekendTest.problems.map(p => p.id);
          }
        }
      } catch (error) {
        console.error("Failed to load syllabus for weekend problems:", error);
      }

      const participants = await ctx.db.contestParticipant.findMany({
        where: {
          contestId: input.contestId,
        },
        include: {
          user: {
            include: {
              progress: {
                where: { completed: true },
                include: {
                  topic: true,
                  problem: true,
                },
              },
              streaks: true,
            },
          },
        },
      });

      const leaderboard = participants.map((participant) => {
        // Count only weekend problems if we have weekend problem IDs
        const weekendSolved = weekendProblemIds.length > 0
          ? participant.user.progress.filter(p => 
              weekendProblemIds.includes(p.problem.leetcodeId)
            ).length
          : 0;

        const totalSolved = participant.user.progress.length;

        const topicProgress = participant.user.progress.reduce((acc, p) => {
          const topicName = p.topic.name;
          acc[topicName] ??= 0;
          acc[topicName]++;
          return acc;
        }, {} as Record<string, number>);

        const averageTime = totalSolved > 0
          ? participant.user.progress.reduce((sum, p) => sum + (p.solvingTime ?? 0), 0) / totalSolved
          : 0;

        const streak = participant.user.streaks[0];

        return {
          userId: participant.user.id,
          name: participant.user.name,
          image: participant.user.image,
          leetcodeUsername: participant.user.leetcodeUsername,
          linkedinUsername: participant.user.linkedinUsername,
          totalSolved: weekendSolved, // Show weekend problems solved instead of total
          weekendSolved, // Keep this for reference
          topicProgress,
          averageTime,
          currentStreak: streak?.currentStreak ?? 0,
          longestStreak: streak?.longestStreak ?? 0,
          lastActiveAt: streak?.lastActiveAt,
        };
      });

      return leaderboard.sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) {
          return b.totalSolved - a.totalSolved;
        }
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak;
        }
        return a.averageTime - b.averageTime;
      });
    }),

  getTopicLeaderboard: publicProcedure
    .input(z.object({
      contestId: z.string(),
      topicId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.contestParticipant.findMany({
        where: {
          contestId: input.contestId,
          isVisible: true,
        },
        include: {
          user: {
            include: {
              progress: {
                where: {
                  topicId: input.topicId,
                  completed: true,
                },
              },
            },
          },
        },
      });

      const leaderboard = participants
        .map((participant) => ({
          userId: participant.user.id,
          name: participant.user.name,
          image: participant.user.image,
          solved: participant.user.progress.length,
        }))
        .filter((entry) => entry.solved > 0)
        .sort((a, b) => b.solved - a.solved);

      return leaderboard;
    }),
});
