/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { createClient } from "~/lib/supabase/client";

interface LeetCodeStats {
  username: string;
  profile: {
    realName: string;
    userAvatar: string;
    ranking: number;
    reputation: number;
  };
  submitStats: {
    acSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
  };
  badges: Array<{
    id: string;
    displayName: string;
    icon: string;
  }>;
  userCalendar: {
    activeYears: number[];
    streak: number;
    totalActiveDays: number;
    submissionCalendar: string;
  };
}

interface Contest {
  id: string;
  name: string;
  startDate: string;
  difficulty: string;
  currentStreak: number;
  paymentStatus: string;
  lastWeekendSuccess: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(
    null
  );
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email ?? null);
        setUserName(data.user.user_metadata.full_name as string ?? data.user.user_metadata.name as string ?? null);
        setUserImage(data.user.user_metadata.avatar_url as string ?? data.user.user_metadata.picture as string ?? null);
        
        // Fetch leetcode username from database
        const profileResponse = await fetch(`/api/trpc/user.getProfile?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22userId%22%3A%22${data.user.id}%22%7D%7D%7D`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json() as Array<{ result: { data?: { json?: { leetcodeUsername?: string } } } }>;
          setLeetcodeUsername(profileData[0]?.result?.data?.json?.leetcodeUsername ?? null);
        }
      } else {
        router.push("/auth/signin");
      }
      setIsLoading(false);
    };
    void fetchUser();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      if (!userId || !leetcodeUsername) return;

      try {
        // Fetch LeetCode stats
        const leetcodeResponse = await fetch("/api/leetcode/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: leetcodeUsername }),
        });

        if (leetcodeResponse.ok) {
          const data = await leetcodeResponse.json() as LeetCodeStats;
          setLeetcodeStats(data);
        }

        // TODO: Fetch user contests via tRPC
        // For now, using placeholder data
        setContests([]);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (userId && leetcodeUsername) {
      void fetchData();
    } else {
      setLoading(false);
    }
  }, [userId, leetcodeUsername]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const easyCount =
    leetcodeStats?.submitStats.acSubmissionNum.find(
      (s) => s.difficulty === "Easy"
    )?.count ?? 0;
  const mediumCount =
    leetcodeStats?.submitStats.acSubmissionNum.find(
      (s) => s.difficulty === "Medium"
    )?.count ?? 0;
  const hardCount =
    leetcodeStats?.submitStats.acSubmissionNum.find(
      (s) => s.difficulty === "Hard"
    )?.count ?? 0;
  const totalSolved = easyCount + mediumCount + hardCount;

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4 py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="relative mx-auto mb-6 h-32 w-32">
            <div className="absolute inset-0 rounded-full bg-linear-to-r from-purple-500 to-pink-500 opacity-50 blur-xl" />
            <img
              src={
                leetcodeStats?.profile.userAvatar ??
                userImage ??
                "/default-avatar.png"
              }
              alt="Profile"
              className="relative h-full w-full rounded-full border-4 border-purple-500/50 object-cover"
            />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-white">
            {leetcodeStats?.profile.realName ?? userName}
          </h1>
          <p className="text-lg text-gray-400">
            @{leetcodeUsername}
          </p>
          {leetcodeStats && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="text-gray-300">
                <span className="font-semibold text-white">
                  #{leetcodeStats.profile.ranking.toLocaleString()}
                </span>{" "}
                Global Rank
              </div>
              <div className="text-gray-300">
                <span className="font-semibold text-white">
                  {leetcodeStats.profile.reputation}
                </span>{" "}
                Reputation
              </div>
              <div className="text-gray-300">
                <span className="font-semibold text-white">
                  {leetcodeStats.userCalendar.streak}
                </span>{" "}
                Day Streak
              </div>
            </div>
          )}
        </motion.div>

        {/* Kanban Layout - Three Columns */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Column 1: LeetCode Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">LeetCode Stats</h2>

            {/* Total Problems Solved */}
            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Problems Solved
              </h3>
              <div className="mb-4 text-center">
                <div className="text-5xl font-bold text-purple-400">
                  {totalSolved}
                </div>
                <div className="text-sm text-gray-400">Total Accepted</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400">Easy</span>
                  <span className="text-sm font-semibold text-white">
                    {easyCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-400">Medium</span>
                  <span className="text-sm font-semibold text-white">
                    {mediumCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">Hard</span>
                  <span className="text-sm font-semibold text-white">
                    {hardCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Activity Calendar */}
            {leetcodeStats && (
              <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Activity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Days</span>
                    <span className="font-semibold text-white">
                      {leetcodeStats.userCalendar.totalActiveDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Streak</span>
                    <span className="font-semibold text-white">
                      {leetcodeStats.userCalendar.streak} days
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Badges */}
            {leetcodeStats && leetcodeStats.badges.length > 0 && (
              <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {leetcodeStats.badges.slice(0, 6).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2"
                    >
                      <img
                        src={badge.icon}
                        alt={badge.displayName}
                        className="h-6 w-6"
                      />
                      <span className="text-xs text-white">
                        {badge.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>

          {/* Column 2: Active Contests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Active Contests</h2>

            {contests.length === 0 ? (
              <Card className="border-purple-500/20 bg-black/50 p-8 text-center backdrop-blur-xl">
                <div className="text-gray-400">
                  You haven&apos;t joined any contests yet
                </div>
              </Card>
            ) : (
              contests.map((contest) => (
                <Card
                  key={contest.id}
                  className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl transition-all hover:border-purple-500/50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {contest.name}
                    </h3>
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
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Streak</span>
                      <span className="font-semibold text-white">
                        {contest.currentStreak} weeks
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status</span>
                      <span
                        className={
                          contest.paymentStatus === "paid"
                            ? "font-semibold text-green-400"
                            : contest.paymentStatus === "pending"
                            ? "font-semibold text-yellow-400"
                            : "font-semibold text-red-400"
                        }
                      >
                        {contest.paymentStatus === "paid" ? "Paid" : contest.paymentStatus === "pending" ? "Pending" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Weekend</span>
                      <span
                        className={
                          contest.lastWeekendSuccess
                            ? "font-semibold text-green-400"
                            : "font-semibold text-red-400"
                        }
                      >
                        {contest.lastWeekendSuccess ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </motion.div>

          {/* Column 3: Achievements & Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">
              Contest Performance
            </h2>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Overview
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Contests</span>
                  <span className="font-semibold text-white">
                    {contests.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Streak</span>
                  <span className="font-semibold text-white">
                    {Math.max(...contests.map((c) => c.currentStreak), 0)} weeks
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="font-semibold text-white">
                    {contests.length > 0
                      ? Math.round(
                          (contests.filter((c) => c.lastWeekendSuccess).length /
                            contests.length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-purple-500/20 bg-black/50 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400">Email</div>
                  <div className="text-white">{userEmail}</div>
                </div>
                <div>
                  <div className="text-gray-400">LeetCode</div>
                  <div className="text-white">
                    @{leetcodeUsername}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
