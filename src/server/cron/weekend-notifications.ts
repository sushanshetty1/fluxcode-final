import { db } from "~/server/db";
import { sendWeekendContestStart, sendWeekendReminderIncomplete } from "~/server/services/email";

/**
 * Send weekend contest start notifications to all participants
 * Should be run every Saturday at midnight IST (start of weekend contest)
 */
export async function notifyWeekendContestStart() {
  console.log("\n=== Running weekend contest start notifications ===");
  console.log("Timestamp:", new Date().toISOString());
  
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

    console.log(`Found ${contests.length} active contest(s)`);

    if (contests.length === 0) {
      console.log("⚠️ No active contests found - no notifications to send");
      console.log("=== Weekend contest start notifications completed ===\n");
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
        weekNumber: number;
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
      const currentWeekData = syllabus.weeks.find((w) => w.weekNumber === currentWeekNumber);
      if (!currentWeekData?.weekendTest) {
        console.log(`No weekend test found for contest ${contest.id}, week ${currentWeekNumber}`);
        continue;
      }

      const weekendProblems = currentWeekData.weekendTest.problems.map((p) => ({
        title: p.title,
        difficulty: p.difficulty,
      }));

      // Send notification to all paid participants
      console.log(`\nProcessing ${contest.participants.length} participants for contest ${contest.id}:`);
      let sentCount = 0;
      let skippedCount = 0;
      
      for (const participant of contest.participants) {
        if (participant.paymentStatus === "paid" && participant.user.email) {
          try {
            console.log(`  📧 Sending to ${participant.user.email} (${participant.user.name})...`);
            await sendWeekendContestStart(participant.user.email, {
              name: participant.user.name ?? "Participant",
              contestName: contest.name,
              weekNumber: currentWeekNumber,
              problems: weekendProblems,
              contestUrl: `${process.env.NEXTAUTH_URL}/contest/${contest.id}`,
            });
            sentCount++;
          } catch (error) {
            console.error(`  ❌ Failed to send to ${participant.user.email}:`, error);
          }
        } else {
          skippedCount++;
          console.log(`  ⏭️ Skipped ${participant.user.email ?? 'no email'} (payment: ${participant.paymentStatus})`);
        }
      }

      console.log(`\n✅ Contest ${contest.id}, week ${currentWeekNumber}: Sent ${sentCount} emails, skipped ${skippedCount}`);
    }

    console.log("\n=== Weekend contest start notifications completed successfully ===\n");
  } catch (error) {
    console.error("\n❌ Error in notifyWeekendContestStart:", error);
    throw error;
  }
}

/**
 * Send reminder to participants who haven't completed 2/3 problems
 * Should be run every Sunday at 6 PM IST
 */
export async function notifyWeekendReminder() {
  console.log("\n=== Running weekend reminder notifications (6 PM Sunday) ===");
  console.log("Timestamp:", new Date().toISOString());
  
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

    console.log(`Found ${contests.length} active contest(s)`);

    if (contests.length === 0) {
      console.log("⚠️ No active contests found - no reminders to send");
      console.log("=== All weekend reminder notifications completed ===\n");
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
        weekNumber: number;
        topic: string;
        weekendTest?: {
          problems: Array<{ id: string; title: string; difficulty: string }>;
          timeLimit: string;
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
      const currentWeekData = syllabus.weeks.find((w) => w.weekNumber === currentWeekNumber);
      if (!currentWeekData?.weekendTest) {
        console.log(`No weekend test found for contest ${contest.id}, week ${currentWeekNumber}`);
        continue;
      }

      // Get weekend test info
      const weekendTest = currentWeekData.weekendTest;
      const topicName = currentWeekData.topic;
      const weekendProblemIds = weekendTest.problems.map(p => p.id);
      
      console.log(`\n📊 Checking reminders for contest ${contest.id}, week ${currentWeekNumber}:`);
      console.log(`   Weekend topic: ${topicName}`);
      console.log(`   Weekend problem IDs: ${weekendProblemIds.join(', ')}`);
      console.log(`   Available topics: ${contest.topics.map(t => t.name).join(', ')}`);

      // Find problems matching the weekend test problem IDs across all topics
      const weekendProblems: Array<{ id: string; title: string; difficulty: string; leetcodeId: string; progress: Array<{ userId: string; completed: boolean }> }> = [];
      
      for (const topic of contest.topics) {
        const matchingProblems = topic.problems.filter(p => weekendProblemIds.includes(p.leetcodeId));
        weekendProblems.push(...matchingProblems);
      }

      if (weekendProblems.length === 0) {
        console.log(`⚠️ No weekend test problems found in contest`);
        console.log(`   Looking for LeetCode IDs: ${weekendProblemIds.join(', ')}`);
        continue;
      }

      console.log(`   Found ${weekendProblems.length}/${weekendProblemIds.length} weekend problems`);
      console.log(`   Total participants: ${contest.participants.length}`);

      let remindersSent = 0;
      let participantsSkipped = 0;

      // Check each paid participant's progress
      for (const participant of contest.participants) {
        const isPaid = participant.paymentStatus === "paid";
        
        if (!isPaid) {
          participantsSkipped++;
          console.log(`   ⏭️  Skipped ${participant.user.email} - payment: ${participant.paymentStatus}`);
          continue;
        }
        
        if (!participant.user.email) {
          participantsSkipped++;
          console.log(`   ⏭️  Skipped user ${participant.userId} - no email`);
          continue;
        }

        // Count solved weekend problems for this participant
        const solvedProblems = weekendProblems.filter((problem) =>
          problem.progress.some((p) => p.userId === participant.userId && p.completed)
        );

        const solvedCount = solvedProblems.length;
        const totalProblems = weekendProblems.length;

        console.log(`   👤 ${participant.user.name} (${participant.user.email}): ${solvedCount}/${totalProblems} solved`);

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
            remindersSent++;
            console.log(`      📧 Sent reminder - needs ${2 - solvedCount} more problem(s)`);
          } catch (error) {
            console.error(`      ❌ Failed to send reminder:`, error);
          }
        } else {
          console.log(`      ✅ No reminder needed - solved ${solvedCount}/3`);
        }
      }

      console.log(`\n✅ Contest ${contest.id}: Sent ${remindersSent} reminders, skipped ${participantsSkipped}`);
    }

    console.log("\n=== All weekend reminder notifications completed successfully ===\n");
  } catch (error) {
    console.error("\n❌ Error in notifyWeekendReminder:", error);
    throw error;
  }
}
