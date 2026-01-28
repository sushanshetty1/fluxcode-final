"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { WeeklyProgressCard } from "~/components/WeeklyProgressCard";
import { PaymentModal } from "~/components/PaymentModal";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";

interface SyllabusWeek {
  weekNumber: number;
  topic: string;
  concepts: string[];
  resources: string[];
  weekdayHomework: Array<{
    id: string;
    title: string;
    difficulty: string;
  }>;
  weekendTest: {
    problems: Array<{
      id: string;
      title: string;
      difficulty: string;
    }>;
    timeLimit: string;
  };
}

interface Syllabus {
  level: string;
  duration: string;
  totalWeeks: number;
  description: string;
  weeks: SyllabusWeek[];
}

export default function ContestDashboard() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;

  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: contest, refetch: refetchContest } = api.contest.getById.useQuery(
    { id: contestId, userId: userId ?? undefined },
    { enabled: !!contestId }
  );

  const joinContest = api.contest.join.useMutation({
    onSuccess: () => {
      void refetchContest();
      setShowPaymentModal(true);
    },
  });

  const markProblemCompleted = api.progress.markContestProblemCompleted.useMutation({
    onSuccess: () => {
      void refetchContest();
    },
  });

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.push("/auth/signin");
      }
      setIsLoading(false);
    };
    void fetchUser();
  }, [router]);

  useEffect(() => {
    // Load syllabus based on contest difficulty
    if (contest?.difficulty) {
      const filename = `${contest.difficulty}-${
        contest.difficulty === "beginner"
          ? "9months"
          : contest.difficulty === "intermediate"
            ? "6months"
            : "5months"
      }.json`;

      fetch(`/syllabi/${filename}`)
        .then((res) => res.json())
        .then((data: Syllabus) => setSyllabus(data))
        .catch((err) => console.error("Failed to load syllabus:", err));
    }
  }, [contest?.difficulty]);

  useEffect(() => {
    // Calculate current week based on start date
    if (contest?.startDate) {
      const start = new Date(contest.startDate);
      const today = new Date();
      const weeksSinceStart = Math.floor(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      setCurrentWeek(Math.max(1, weeksSinceStart + 1));
    }
  }, [contest?.startDate]);

  if (isLoading || !contest) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const participant = contest.participants.find(
    (p) => p.userId === userId
  );
  const isParticipant = !!participant;
  const needsPayment = participant?.needsPayment ?? true;
  const hasPaid = participant?.hasPaid ?? false;

  const handleJoinContest = () => {
    if (!userId) return;
    joinContest.mutate({
      userId: userId,
      contestId: contest.id,
      password: contest.password ?? undefined,
    });
  };

  const getWeekData = (week: SyllabusWeek) => {
    // Get actual solved data from userProgress
    // Map by leetcodeId (from syllabus) instead of database problemId
    const userProgressMap = new Map(
      contest?.userProgress?.map((p) => [p.problem.leetcodeId, p.completed]) ?? []
    );

    const weekdayProblems = week.weekdayHomework.map((p) => ({
      ...p,
      solved: userProgressMap.get(p.id) ?? false,
    }));

    const weekendProblems = week.weekendTest.problems.map((p) => ({
      ...p,
      solved: userProgressMap.get(p.id) ?? false,
    }));

    const weekdaySolved = weekdayProblems.filter((p) => p.solved).length;
    const weekendSolved = weekendProblems.filter((p) => p.solved).length;

    return {
      ...week,
      weekdaySolved,
      weekendSolved,
      weekdayHomework: weekdayProblems,
      weekendTest: {
        ...week.weekendTest,
        problems: weekendProblems,
      },
    };
  };

  // Check if it's weekend (Saturday or Sunday)
  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-white">
                {contest.name}
              </h1>
              {contest.description && (
                <p className="text-lg text-gray-400">{contest.description}</p>
              )}
            </div>
            <Badge
              className={
                contest.difficulty === "beginner"
                  ? "bg-green-500/20 text-green-400"
                  : contest.difficulty === "intermediate"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
              }
            >
              {contest.difficulty.toUpperCase()}
            </Badge>
          </div>

          {/* Contest Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-purple-500/20 bg-black/50 p-4 backdrop-blur-xl">
              <div className="text-sm text-gray-400">Duration</div>
              <div className="text-2xl font-bold text-white">
                {syllabus?.duration ?? "Loading..."}
              </div>
            </Card>
            <Card className="border-purple-500/20 bg-black/50 p-4 backdrop-blur-xl">
              <div className="text-sm text-gray-400">Current Week</div>
              <div className="text-2xl font-bold text-white">
                Week {currentWeek}
              </div>
            </Card>
            <Card className="border-purple-500/20 bg-black/50 p-4 backdrop-blur-xl">
              <div className="text-sm text-gray-400">Your Streak</div>
              <div className="text-2xl font-bold text-purple-400">
                {participant?.currentStreak ?? 0} 🔥
              </div>
            </Card>
            <Card className="border-purple-500/20 bg-black/50 p-4 backdrop-blur-xl">
              <div className="text-sm text-gray-400">Participants</div>
              <div className="text-2xl font-bold text-white">
                {contest.participants.length}
              </div>
            </Card>
          </div>

          {/* Payment Status Warning */}
          {isParticipant && needsPayment && !hasPaid && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-400">
                    ⚠️ Payment Required
                  </h3>
                  <p className="text-sm text-gray-300">
                    You failed last weekend&apos;s test. Pay
                    ₹{contest.penaltyAmount} to continue.
                  </p>
                </div>
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Pay Now
                </Button>
              </div>
            </motion.div>
          )}

          {/* Join Contest Button */}
          {!isParticipant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              <Card className="border-purple-500/20 bg-black/50 p-6 text-center backdrop-blur-xl">
                <h3 className="mb-2 text-xl font-bold text-white">
                  Join this Contest
                </h3>
                <p className="mb-4 text-gray-400">
                  Entry fee: ₹{contest.penaltyAmount}. Maintain 2/3 problems
                  each weekend to continue!
                </p>
                <Button
                  onClick={handleJoinContest}
                  disabled={joinContest.isPending}
                  className="bg-linear-to-r from-purple-500 to-pink-500 px-8 py-3"
                >
                  {joinContest.isPending ? "Joining..." : "Join Contest"}
                </Button>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Weekly Progress */}
        {isParticipant && syllabus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-6 text-2xl font-bold text-white">
              Your Progress
            </h2>
            <div className="space-y-6">
              {syllabus.weeks.slice(0, currentWeek).map((week) => (
                <WeeklyProgressCard
                  key={week.weekNumber}
                  week={getWeekData(week)}
                  isWeekend={isWeekend()}
                  onVerify={async (problemId: string, problemTitle: string) => {
                    if (!userId) return;
                    await markProblemCompleted.mutateAsync({
                      userId,
                      contestId: contest.id,
                      problemId,
                      problemTitle,
                    });
                  }}
                />
              ))}
            </div>

            {/* Upcoming Weeks Preview */}
            {currentWeek < syllabus.totalWeeks && (
              <Card className="mt-6 border-purple-500/20 bg-black/50 p-6 text-center backdrop-blur-xl">
                <div className="text-gray-400">
                  <span className="font-semibold text-white">
                    {syllabus.totalWeeks - currentWeek}
                  </span>{" "}
                  weeks remaining
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Keep your streak going! 🔥
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          contestId={contest.id}
          amount={contest.penaltyAmount}
          weekNumber={needsPayment && hasPaid ? undefined : currentWeek}
          onSuccess={() => {
            void refetchContest();
          }}
        />
      </div>
    </div>
  );
}
