import { db } from "~/server/db";
import { sendWeekendContestStart, sendWeekendReminderIncomplete } from "~/server/services/email";

/**
 * Send weekend contest start notifications to all participants
 * Should be run every Saturday at midnight IST (start of weekend contest)
 */
export async function notifyWeekendContestStart() {
  console.log("Running weekend contest start notifications...");
  
  try {
    // Get all active contests
    const contests = await db.contest.findMany({
      where: {
        isActive: true,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (contests.length === 0) {
      console.log("No active contests found");
      console.log("Weekend contest start notifications completed");
      return;
    }

    for (const contest of contests) {
      // Calculate current week number based on start date
      const now = new Date();
      const startDate = new Date(contest.startDate);
      
      // Skip if contest hasn't started yet
      if (now < startDate) {
        console.log(`Contest ${contest.id} hasn't started yet (starts ${startDate.toISOString()}), skipping`);
        continue;
      }
      
      const weeksSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeekNumber = weeksSinceStart + 1;

      // Get the syllabus for this contest
      interface SyllabusWeek {
        week: number;
        weekendTest?: {
          topicName: string;
          problems: Array<{ title: string; difficulty: string }>;
        };
      }
      interface Syllabus {
        weeks: SyllabusWeek[];
      }
      
      let syllabus: Syllabus;
      try {
        const syllabusMap: Record<string, string> = {
          'beginner': 'beginner-9months.json',
          'intermediate': 'intermediate-6months.json',
          'advanced': 'advanced-5months.json',
        };
        const syllabusFile = syllabusMap[contest.difficulty];
        if (!syllabusFile) {
          console.error(`Unknown difficulty level: ${contest.difficulty}`);
          continue;
        }
        syllabus = await import(`../../../public/syllabi/${syllabusFile}`);
      } catch (error) {
        console.error(`Failed to load syllabus for contest ${contest.id}:`, error);
        continue;
      }

      // Find current week's weekend test
      const currentWeekData = syllabus.weeks.find((w) => w.week === currentWeekNumber);
      if (!currentWeekData?.weekendTest) {
        console.log(`No weekend test found for contest ${contest.id}, week ${currentWeekNumber}`);
        continue;
      }

      const weekendProblems = currentWeekData.weekendTest.problems.map((p) => ({
        title: p.title,
        difficulty: p.difficulty,
      }));

      // Send notification to all paid participants
      for (const participant of contest.participants) {
        if (participant.paymentStatus === "paid" && participant.user.email) {
          try {
            await sendWeekendContestStart(participant.user.email, {
              name: participant.user.name ?? "Participant",
              contestName: contest.name,
              weekNumber: currentWeekNumber,
              problems: weekendProblems,
              contestUrl: `${process.env.NEXTAUTH_URL}/contest/${contest.id}`,
            });
          } catch (error) {
            console.error(`Failed to send weekend start email to ${participant.user.email}:`, error);
          }
        }
      }

      console.log(`Sent weekend contest start notifications for contest ${contest.id}, week ${currentWeekNumber}`);
    }

    console.log("Weekend contest start notifications completed");
  } catch (error) {
    console.error("Error in notifyWeekendContestStart:", error);
    throw error;
  }
}

/**
 * Send reminder to participants who haven't completed 2/3 problems
 * Should be run every Sunday at 6 PM IST
 */
export async function notifyWeekendReminder() {
  console.log("Running weekend reminder notifications (6 PM Sunday)...");
  
  // Optional: Skip specific dates (uncomment and modify as needed)
  // const today = new Date();
  // const skipDates = [
  //   new Date('2026-02-02'), // Skip February 2, 2026
  //   new Date('2026-02-09'), // Skip February 9, 2026
  // ];
  // if (skipDates.some(skipDate => 
  //   today.getFullYear() === skipDate.getFullYear() &&
  //   today.getMonth() === skipDate.getMonth() &&
  //   today.getDate() === skipDate.getDate()
  // )) {
  //   console.log("Skipping reminder for today (manually configured skip date)");
  //   return;
  // }
  
  try {
    // Get all active contests
    const contests = await db.contest.findMany({
      where: {
        isActive: true,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        topics: {
          include: {
            problems: {
              include: {
                progress: true,
              },
            },
          },
        },
      },
    });

    if (contests.length === 0) {
      console.log("No active contests found");
      console.log("All weekend reminder notifications completed");
      return;
    }

    for (const contest of contests) {
      // Calculate current week number
      const now = new Date();
      const startDate = new Date(contest.startDate);
      
      // Skip if contest hasn't started yet
      if (now < startDate) {
        console.log(`Contest ${contest.id} hasn't started yet (starts ${startDate.toISOString()}), skipping reminder`);
        continue;
      }
      
      const weeksSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeekNumber = weeksSinceStart + 1;

      // Get the syllabus for this contest
      interface SyllabusWeek {
        week: number;
        weekendTest?: {
          topicName: string;
          problems: Array<{ title: string; difficulty: string }>;
        };
      }
      interface Syllabus {
        weeks: SyllabusWeek[];
      }
      
      let syllabus: Syllabus;
      try {
        const syllabusMap: Record<string, string> = {
          'beginner': 'beginner-9months.json',
          'intermediate': 'intermediate-6months.json',
          'advanced': 'advanced-5months.json',
        };
        const syllabusFile = syllabusMap[contest.difficulty];
        if (!syllabusFile) {
          console.error(`Unknown difficulty level: ${contest.difficulty}`);
          continue;
        }
        syllabus = await import(`../../../public/syllabi/${syllabusFile}`);
      } catch (error) {
        console.error(`Failed to load syllabus for contest ${contest.id}:`, error);
        continue;
      }

      // Find current week's weekend test
      const currentWeekData = syllabus.weeks.find((w) => w.week === currentWeekNumber);
      if (!currentWeekData?.weekendTest) {
        console.log(`No weekend test found for contest ${contest.id}, week ${currentWeekNumber}`);
        continue;
      }

      // TypeScript type narrowing - we know weekendTest exists after the check
      const weekendTest = currentWeekData.weekendTest;

      // Find the weekend test topic for this week
      const weekendTopic = contest.topics.find(
        (t) => t.name === weekendTest.topicName
      );

      if (!weekendTopic) {
        console.log(`Weekend topic not found for contest ${contest.id}, week ${currentWeekNumber}`);
        continue;
      }

      // Check each paid participant's progress
      for (const participant of contest.participants) {
        if (participant.paymentStatus !== "PAID" || !participant.user.email) continue;

        // Count solved weekend problems for this participant
        const weekendProblems = weekendTopic.problems;
        const solvedProblems = weekendProblems.filter((problem) =>
          problem.progress.some((p) => p.userId === participant.userId && p.completed)
        );

        const solvedCount = solvedProblems.length;
        const totalProblems = weekendProblems.length;

        // Only send reminder if they haven't solved at least 2/3 problems
        if (solvedCount < 2) {
          const unsolvedProblems = weekendProblems
            .filter((p) => !solvedProblems.includes(p))
            .map((p) => ({
              title: p.title,
              difficulty: p.difficulty,
            }));

          try {
            await sendWeekendReminderIncomplete(participant.user.email, {
              name: participant.user.name ?? "Participant",
              contestName: contest.name,
              weekNumber: currentWeekNumber,
              solvedCount,
              totalProblems,
              unsolvedProblems,
              contestUrl: `${process.env.NEXTAUTH_URL}/contest/${contest.id}`,
            });
            console.log(
              `Sent reminder to ${participant.user.email} - ${solvedCount}/${totalProblems} solved`
            );
          } catch (error) {
            console.error(`Failed to send reminder email to ${participant.user.email}:`, error);
          }
        }
      }

      console.log(`Weekend reminder notifications completed for contest ${contest.id}, week ${currentWeekNumber}`);
    }

    console.log("All weekend reminder notifications completed");
  } catch (error) {
    console.error("Error in notifyWeekendReminder:", error);
    throw error;
  }
}
