"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";
import {
  Users,
  TrendingUp,
  IndianRupee,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  difficulty: string;
}

interface WeekendTest {
  problems: Problem[];
  timeLimit: string;
}

interface SyllabusWeek {
  weekNumber: number;
  topic: string;
  concepts: string[];
  resources: string[];
  weekdayHomework: Problem[];
  weekendTest: WeekendTest;
}

interface Syllabus {
  level: string;
  duration: string;
  totalWeeks: number;
  description: string;
  weeks: SyllabusWeek[];
}

export default function AdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);

  const { data: contest } = api.contest.getById.useQuery(
    { id: contestId, userId: userId ?? undefined },
    { enabled: !!contestId && !!userId },
  );

  const { data: leaderboard } = api.contest.getLeaderboard.useQuery(
    { contestId },
    { enabled: !!contestId },
  );

  const { data: revenueData } = api.contest.getTotalRevenue.useQuery(
    { contestId },
    { enabled: !!contestId },
  );

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.push("/auth/signin");
      }
    };
    void fetchUser();
  }, [router]);

  useEffect(() => {
    // Check if user is admin/creator
    if (contest && userId) {
      const isCreator = contest.creatorId === userId;
      const participant = contest.participants.find((p) => p.userId === userId);
      const isAdminRole = participant?.role === "creator";

      if (!isCreator && !isAdminRole) {
        router.push(`/contest/${contestId}`);
      }
      setIsAdmin(true);
    }
  }, [contest, userId, contestId, router]);

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

  if (!contest || !leaderboard || !isAdmin) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-primary animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  // Calculate stats
  const totalParticipants = contest.participants.length;
  const activeSolvers = leaderboard.filter((p) => p.currentStreak > 0).length;
  const pendingPayments = leaderboard.filter(
    (p) => p.paymentStatus === "pending",
  ).length;
  const totalRevenue = revenueData?.totalRevenue ?? 0;

  const exportData = () => {
    const data = leaderboard.map((p, idx) => ({
      Rank: idx + 1,
      Name: p.name,
      LeetCode: p.leetcodeUsername,
      Streak: p.currentStreak,
      "Problems Today": p.problemsSolvedToday.length,
      "Payment Status": p.paymentStatus,
    }));

    const csv = [
      Object.keys(data[0]!).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contest.name}-leaderboard.csv`;
    a.click();
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
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-400">{contest.name}</p>
            </div>
            <Button
              onClick={exportData}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-400">Total Participants</div>
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {totalParticipants}
              </div>
            </Card>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-400">Active Solvers</div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {activeSolvers}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {((activeSolvers / totalParticipants) * 100).toFixed(1)}% active
              </div>
            </Card>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-400">Pending Payments</div>
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {pendingPayments}
              </div>
            </Card>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-400">Current Balance</div>
                <IndianRupee className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                ₹{totalRevenue}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Participant Details Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Participant Details
            </h2>
            <div className="flex gap-2">
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Paid:{" "}
                {leaderboard.filter((p) => p.paymentStatus === "paid").length}
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400">
                <Clock className="mr-1 h-3 w-3" />
                Pending: {pendingPayments}
              </Badge>
              <Badge className="bg-red-500/20 text-red-400">
                <XCircle className="mr-1 h-3 w-3" />
                Failed:{" "}
                {leaderboard.filter((p) => p.paymentStatus === "failed").length}
              </Badge>
            </div>
          </div>

          <Card className="overflow-hidden border-purple-500/20 bg-black/50 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-400">
                      Rank
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-400">
                      Participant
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      LeetCode Username
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      Streak
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      Problems Today
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      Payment Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      Amount Due
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-400">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard
                    .sort((a, b) => b.currentStreak - a.currentStreak)
                    .map((participant, index) => {
                      const amountDue =
                        participant.paymentStatus === "pending"
                          ? contest.penaltyAmount
                          : 0;
                      
                      const isExpanded = expandedParticipants.has(participant.userId);
                      const participantProgress = contest.allUserProgress?.filter(
                        p => p.userId === participant.userId
                      ) ?? [];
                      const solvedProblemIds = new Set(
                        participantProgress
                          .filter(p => p.completed)
                          .map(p => p.problemId)
                      );

                      return (
                        <>
                        <tr
                          key={participant.userId}
                          className="border-b border-white/5 transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4 font-semibold text-white">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="font-medium text-white">
                                {participant.name ?? "Anonymous"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-300">
                            <a className="font-mono" href={`https://leetcode.com/u/${participant.leetcodeUsername}`} target="_blank" rel="noopener noreferrer">
                              {participant.leetcodeUsername ?? "—"}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              className={
                                participant.currentStreak > 5
                                  ? "bg-purple-500/20 text-purple-400"
                                  : participant.currentStreak > 0
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }
                            >
                              {participant.currentStreak}{" "}
                              {participant.currentStreak > 0 ? "🔥" : ""}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-white">
                              {participant.problemsSolvedToday.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              className={
                                participant.paymentStatus === "paid"
                                  ? "bg-green-500/20 text-green-400"
                                  : participant.paymentStatus === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }
                            >
                              {participant.paymentStatus === "paid" && (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              )}
                              {participant.paymentStatus === "pending" && (
                                <AlertTriangle className="mr-1 h-3 w-3" />
                              )}
                              {participant.paymentStatus === "failed" && (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {participant.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={
                                amountDue > 0
                                  ? "font-semibold text-yellow-400"
                                  : "text-gray-500"
                              }
                            >
                              {amountDue > 0 ? `₹${amountDue}` : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              onClick={() => {
                                setExpandedParticipants(prev => {
                                  const next = new Set(prev);
                                  if (next.has(participant.userId)) {
                                    next.delete(participant.userId);
                                  } else {
                                    next.add(participant.userId);
                                  }
                                  return next;
                                });
                              }}
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm"
                            >
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && syllabus && (
                          <tr className="border-b border-white/5 bg-white/5">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-4">
                                {syllabus?.weeks?.map((week: SyllabusWeek) => {
                                  const weekHomeworkSolved = week.weekdayHomework.filter((p: Problem) => 
                                    solvedProblemIds.has(
                                      contest?.topics
                                        .flatMap(t => t.problems)
                                        .find(prob => prob.leetcodeId === p.id)?.id ?? ""
                                    )
                                  ).length;
                                  const weekWeekendSolved = week.weekendTest.problems.filter((p: Problem) => 
                                    solvedProblemIds.has(
                                      contest?.topics
                                        .flatMap(t => t.problems)
                                        .find(prob => prob.leetcodeId === p.id)?.id ?? ""
                                    )
                                  ).length;
                                  
                                  return (
                                    <div key={week.weekNumber} className="rounded-lg border border-purple-500/20 bg-black/30 p-4">
                                      <h4 className="font-semibold text-white mb-3">
                                        Week {week.weekNumber}: {week.topic}
                                      </h4>
                                      
                                      {/* Homework Problems */}
                                      <div className="mb-3">
                                        <div className="text-sm text-gray-400 mb-2">
                                          Homework: {weekHomeworkSolved}/{week.weekdayHomework.length} solved
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {week.weekdayHomework.map((problem: Problem) => {
                                            const problemId = contest?.topics
                                              .flatMap(t => t.problems)
                                              .find(p => p.leetcodeId === problem.id)?.id;
                                            const isSolved = problemId && solvedProblemIds.has(problemId);
                                            
                                            return (
                                              <div
                                                key={problem.id}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                <span className={isSolved ? "text-green-400" : "text-red-400"}>
                                                  {isSolved ? "✓" : "✗"}
                                                </span>
                                                <span className={isSolved ? "text-white" : "text-gray-500"}>
                                                  {problem.title}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      
                                      {/* Weekend Problems */}
                                      <div>
                                        <div className="text-sm text-gray-400 mb-2">
                                          Weekend Test: {weekWeekendSolved}/{week.weekendTest.problems.length} solved
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {week.weekendTest.problems.map((problem: Problem) => {
                                            const problemId = contest?.topics
                                              .flatMap(t => t.problems)
                                              .find(p => p.leetcodeId === problem.id)?.id;
                                            const isSolved = problemId && solvedProblemIds.has(problemId);
                                            
                                            return (
                                              <div
                                                key={problem.id}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                <span className={isSolved ? "text-green-400" : "text-red-400"}>
                                                  {isSolved ? "✓" : "✗"}
                                                </span>
                                                <span className={isSolved ? "text-white" : "text-gray-500"}>
                                                  {problem.title}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Contest Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-white">
            Contest Information
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Timeline</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Date:</span>
                  <span className="font-medium text-white">
                    {new Date(contest.startDate).toLocaleDateString()}
                  </span>
                </div>
                {contest.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">End Date:</span>
                    <span className="font-medium text-white">
                      {new Date(contest.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <Badge
                    className={
                      contest.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }
                  >
                    {contest.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <Award className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Settings</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <Badge
                    className={
                      contest.difficulty === "beginner"
                        ? "bg-green-500/20 text-green-400"
                        : contest.difficulty === "intermediate"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }
                  >
                    {contest.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Penalty Amount:</span>
                  <span className="font-medium text-white">
                    ₹{contest.penaltyAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Topics:</span>
                  <span className="font-medium text-white">
                    {contest.topics.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
