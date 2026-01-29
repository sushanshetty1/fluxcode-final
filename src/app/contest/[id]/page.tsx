/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { WeeklyProgressCard } from "~/components/WeeklyProgressCard";
import { PaymentModal } from "~/components/PaymentModal";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";
import { Trophy, LayoutDashboard } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: "article" | "video" | "documentation";
  url: string;
  description?: string;
  duration?: string;
}

interface SyllabusWeek {
  weekNumber: number;
  topic: string;
  concepts: string[];
  resources: string[];
  materials?: Material[];
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
  const [view, setView] = useState<"dashboard" | "materials" | "leaderboard">("dashboard");
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
  const penaltyCheckDone = useRef(false);

  const { data: contest, refetch: refetchContest } = api.contest.getById.useQuery(
    { id: contestId, userId: userId ?? undefined },
    { enabled: !!contestId }
  );

  const { data: leaderboard } = api.contest.getLeaderboard.useQuery(
    { contestId },
    { enabled: !!contestId && view === "leaderboard" }
  );

  const { data: materialProgress, refetch: refetchMaterials } = api.material.getProgress.useQuery(
    { contestId, userId: userId ?? undefined },
    { enabled: !!contestId && !!userId && view === "materials" }
  );

  const markMaterialComplete = api.material.markComplete.useMutation({
    onSuccess: () => {
      void refetchMaterials();
      void refetchContest();
    },
  });

  const unmarkMaterialComplete = api.material.unmarkComplete.useMutation({
    onSuccess: () => {
      void refetchMaterials();
      void refetchContest();
    },
  });

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

  const checkPenalties = api.contest.checkWeekendPenalties.useMutation();

  const handleJoinContest = () => {
    if (!userId || !contest) return;
    joinContest.mutate({
      userId: userId,
      contestId: contest.id,
      password: contest.password ?? undefined,
    });
  };

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
    // Calculate current week and check weekend penalty status
    // Changed to Monday-based weeks instead of Sunday
    if (contest?.startDate && syllabus && userId && contestId && !penaltyCheckDone.current) {
      const getMondayOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
      };

      const startMonday = getMondayOfWeek(new Date(contest.startDate));
      const currentMonday = getMondayOfWeek(new Date());
      const weeksSinceStart = Math.floor(
        (currentMonday.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      const calculatedWeek = Math.max(1, weeksSinceStart + 1);
      setCurrentWeek(calculatedWeek);

      // Auto-collapse all previous weeks except current week
      if (calculatedWeek > 1) {
        const newCollapsed = new Set<number>();
        for (let i = 1; i < calculatedWeek; i++) {
          newCollapsed.add(i);
        }
        setCollapsedWeeks(newCollapsed);
      }

      // Check if user is in a later week and hasn't completed previous weekend test
      if (calculatedWeek > 1) {
        const previousWeek = calculatedWeek - 1;
        const previousWeekData = syllabus.weeks[previousWeek - 1];
        
        if (previousWeekData) {
          // Get user's progress for previous week's weekend problems
          const weekendProblemIds = new Set(previousWeekData.weekendTest.problems.map(p => p.id));
          const solvedWeekendProblems = contest.userProgress?.filter(
            p => weekendProblemIds.has(p.problem.leetcodeId) && p.completed
          ).length ?? 0;

          // If user solved less than 2 weekend problems and is marked as paid, trigger penalty check
          const participant = contest.participants.find(p => p.userId === userId);
          if (solvedWeekendProblems < 2 && participant?.paymentStatus === "paid") {
            penaltyCheckDone.current = true;
            checkPenalties.mutate({ contestId, userId }, {
              onSuccess: () => {
                void refetchContest();
              }
            });
          }
        }
      }
    }
    // Removed refetchContest from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.startDate, contest?.userProgress, contest?.participants, syllabus, userId, contestId, checkPenalties]);

  if (isLoading || !contest) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-20">
      q    <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if contest hasn't started yet
  const today = new Date();
  const contestStart = new Date(contest.startDate);
  const hasNotStarted = today < contestStart;

  const participant = contest.participants.find(
    (p) => p.userId === userId
  );
  const isParticipant = !!participant;
  const paymentStatus = participant?.paymentStatus ?? "pending";

  if (hasNotStarted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-20">
          <Card className="border-purple-500/20 bg-black/50 p-12 text-center backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="mb-4 text-4xl font-bold text-white">{contest.name}</h1>
              <div className="mb-6 text-6xl">🚀</div>
              <h2 className="mb-4 text-2xl font-semibold text-purple-400">Starting Soon!</h2>
              <p className="mb-2 text-lg text-gray-300">
                Contest begins on{" "}
                <span className="font-bold text-white">
                  {contestStart.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
              <p className="text-gray-400">Get ready to start your coding journey!</p>

              {/* Show payment button if not paid or join button if not participant */}
              <div className="mt-8 flex flex-col items-center gap-4">
                {isParticipant && paymentStatus === "pending" && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Pay Now (₹{contest.penaltyAmount})
                  </Button>
                )}
                
                {!isParticipant && (
                  <Button
                    onClick={handleJoinContest}
                    disabled={joinContest.isPending}
                    className="bg-linear-to-r from-purple-500 to-pink-500 px-8 py-3"
                  >
                    {joinContest.isPending ? "Joining..." : `Join Contest (₹${contest.penaltyAmount})`}
                  </Button>
                )}
                
                <Button
                  onClick={() => router.push("/contests")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back to Contests
                </Button>
              </div>
            </motion.div>
          </Card>
        </div>
      </div>
    );
  }

  const categorizeProblemsSolvedToday = (problemIds: string[], currentWeek: number) => {
    if (!syllabus) return { homework: 0, weekend: 0 };
    
    const weekData = syllabus.weeks[currentWeek - 1];
    if (!weekData) return { homework: 0, weekend: 0 };
    
    const homeworkIds = new Set(weekData.weekdayHomework.map(p => p.id));
    const weekendIds = new Set(weekData.weekendTest.problems.map(p => p.id));
    
    let homework = 0;
    let weekend = 0;
    
    problemIds.forEach(id => {
      if (homeworkIds.has(id)) homework++;
      if (weekendIds.has(id)) weekend++;
    });
    
    return { homework, weekend };
  };

  // Helper to determine if weekend test should be shown
  // Only show weekend test for previous weeks, NOT current week
  const shouldShowWeekendTest = (weekNumber: number) => {
    return weekNumber < currentWeek;
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

          {/* View Toggle */}
          <div className="mt-6 flex gap-2">
            <Button
              onClick={() => setView("dashboard")}
              variant={view === "dashboard" ? "default" : "outline"}
              className={view === "dashboard" ? "bg-primary text-black" : "border-white/20 text-white"}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => setView("materials")}
              variant={view === "materials" ? "default" : "outline"}
              className={view === "materials" ? "bg-primary text-black" : "border-white/20 text-white"}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Materials
            </Button>
            <Button
              onClick={() => setView("leaderboard")}
              variant={view === "leaderboard" ? "default" : "outline"}
              className={view === "leaderboard" ? "bg-primary text-black" : "border-white/20 text-white"}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
          </div>

          {/* Payment Status Warning */}
          {isParticipant && paymentStatus === "pending" && (
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

        {/* Dashboard View */}
        {isParticipant && view === "dashboard" && syllabus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-6 text-2xl font-bold text-white">
              Your Progress
            </h2>

            {/* Stats Overview */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Materials Stats */}
              <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-400">Study Materials</div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white">
                  {materialProgress?.filter(p => p.completed).length ?? 0}
                  <span className="text-xl text-gray-400 ml-1">
                    / {syllabus.weeks.slice(0, currentWeek).reduce((acc, week) => acc + (week.materials?.length ?? 0), 0)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-purple-400">
                  +{(materialProgress?.filter(p => p.completed).length ?? 0) * 5} points earned
                </div>
              </Card>

              {/* Total Points Stats */}
              <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-400">Total Points</div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white">
                  {leaderboard?.find(p => p.userId === userId)?.points ?? 0}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Homework, Weekend & Materials
                </div>
              </Card>

              {/* Streak Stats */}
              <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-400">Current Streak</div>
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {leaderboard?.find(p => p.userId === userId)?.currentStreak ?? 0}
                  <span className="text-xl text-gray-400 ml-1">days</span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Keep it going!
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {syllabus.weeks.slice(0, currentWeek).map((week) => (
                <WeeklyProgressCard
                  key={week.weekNumber}
                  week={getWeekData(week)}
                  isWeekend={isWeekend()}
                  isCollapsed={collapsedWeeks.has(week.weekNumber)}
                  showWeekendTest={shouldShowWeekendTest(week.weekNumber)}
                  onToggleCollapse={() => {
                    setCollapsedWeeks((prev) => {
                      const next = new Set(prev);
                      if (next.has(week.weekNumber)) {
                        next.delete(week.weekNumber);
                      } else {
                        next.add(week.weekNumber);
                      }
                      return next;
                    });
                  }}
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

        {/* Materials View */}
        {isParticipant && view === "materials" && syllabus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-6 text-2xl font-bold text-white">
              Study Materials
            </h2>
            <p className="mb-6 text-gray-400">
              Complete study materials to earn <span className="font-semibold text-purple-400">5 points</span> each. 
              Be honest with yourself - only mark materials as complete after you&apos;ve truly studied them! 📚
            </p>
            
            <div className="space-y-6">
              {syllabus.weeks.slice(0, currentWeek).map((week) => {
                const weekMaterials = week.materials ?? [];
                const completedMaterials = weekMaterials.filter(material => 
                  materialProgress?.some(p => p.materialId === material.id && p.completed)
                );
                
                return (
                  <Card key={week.weekNumber} className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Week {week.weekNumber}: {week.topic}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {completedMaterials.length}/{weekMaterials.length} materials completed
                        </p>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        {completedMaterials.length * 5} points earned
                      </Badge>
                    </div>

                    {weekMaterials.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No materials available for this week yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {weekMaterials.map((material) => {
                          const isCompleted = materialProgress?.some(
                            p => p.materialId === material.id && p.completed
                          );

                          return (
                            <div
                              key={material.id}
                              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                            >
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={async (e) => {
                                  if (!userId) return;
                                  if (e.target.checked) {
                                    await markMaterialComplete.mutateAsync({
                                      contestId,
                                      materialId: material.id,
                                      userId,
                                    });
                                  } else {
                                    await unmarkMaterialComplete.mutateAsync({
                                      contestId,
                                      materialId: material.id,
                                      userId,
                                    });
                                  }
                                }}
                                className="mt-1 h-5 w-5 cursor-pointer rounded border-purple-500 bg-transparent text-purple-500 focus:ring-2 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-white hover:text-purple-400 transition-colors"
                                  >
                                    {material.title}
                                  </a>
                                  <Badge 
                                    className={
                                      material.type === "video" 
                                        ? "bg-red-500/20 text-red-400 text-xs" 
                                        : material.type === "article"
                                        ? "bg-blue-500/20 text-blue-400 text-xs"
                                        : "bg-green-500/20 text-green-400 text-xs"
                                    }
                                  >
                                    {material.type}
                                  </Badge>
                                  {material.duration && (
                                    <span className="text-xs text-gray-500">
                                      {material.duration}
                                    </span>
                                  )}
                                </div>
                                {material.description && (
                                  <p className="mt-1 text-sm text-gray-400">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Leaderboard View */}
        {view === "leaderboard" && leaderboard && syllabus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-6 text-2xl font-bold text-white">
              Leaderboard
            </h2>
            <Card className="border-purple-500/20 bg-black/50 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-semibold text-gray-400">Rank</th>
                      <th className="px-6 py-4 text-left text-base font-semibold text-gray-400">Participant</th>
                      <th className="px-6 py-4 text-center text-base font-semibold text-gray-400">Streak</th>
                      <th className="px-6 py-4 text-center text-base font-semibold text-gray-400">Homework This Week</th>
                      <th className="px-6 py-4 text-center text-base font-semibold text-gray-400">Weekend Contest</th>
                      <th className="px-6 py-4 text-center text-base font-semibold text-gray-400">Points</th>
                      <th className="px-6 py-4 text-center text-base font-semibold text-gray-400">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard
                      .sort((a, b) => b.points - a.points || b.currentStreak - a.currentStreak)
                      .map((participant, index) => {
                        const { homework, weekend } = categorizeProblemsSolvedToday(
                          participant.problemsSolvedToday,
                          currentWeek
                        );
                        const displayStatus = participant.paymentStatus === "pending" ? "Pending" : participant.paymentStatus === "paid" ? "Paid" : "Failed";
                        
                        return (
                          <tr key={participant.userId} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4 text-white font-semibold text-base">#{index + 1}</td>
                            <td className="px-6 py-4">
                              <a 
                                href={`/profile/${participant.userId}`}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={participant.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name ?? "User")}&background=6366f1&color=fff`}
                                  alt={participant.name ?? "User"}
                                  className="h-10 w-10 rounded-full"
                                />
                                <div>
                                  <div className="text-white font-medium text-base hover:text-primary transition-colors">{participant.name}</div>
                                  {participant.leetcodeUsername && (
                                    <div className="text-sm text-gray-400">@{participant.leetcodeUsername}</div>
                                  )}
                                </div>
                              </a>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-purple-500/20 text-purple-400 text-base">
                                {participant.currentStreak} 🔥
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-white font-semibold text-lg">{homework}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge
                                className={
                                  weekend < 2
                                    ? "bg-red-500/20 text-red-400 text-base"
                                    : "bg-green-500/20 text-green-400 text-base"
                                }
                              >
                                {weekend}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-purple-500/20 text-purple-400 text-base">
                                {participant.points}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge
                                className={
                                  displayStatus === "Paid"
                                    ? "bg-green-500/20 text-green-400 text-base"
                                    : displayStatus === "Pending"
                                    ? "bg-yellow-500/20 text-yellow-400 text-base"
                                    : "bg-red-500/20 text-red-400 text-base"
                                }
                              >
                                {displayStatus}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          contestId={contest.id}
          amount={contest.penaltyAmount}
          weekNumber={paymentStatus === "paid" ? currentWeek : undefined}
          onSuccess={() => {
            void refetchContest();
          }}
        />
      </div>
    </div>
  );
}
