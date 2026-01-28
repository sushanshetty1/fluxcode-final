/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { NavBar } from "~/components/ui/navbar";
import { api } from "~/trpc/react";

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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const { data: userProfile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeetCodeStats() {
      if (!userProfile?.leetcodeUsername) {
        setStatsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/leetcode/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userProfile.leetcodeUsername }),
        });

        if (response.ok) {
          const data = await response.json() as LeetCodeStats;
          setLeetcodeStats(data);
        }
      } catch (error) {
        console.error("Error fetching LeetCode stats:", error);
      } finally {
        setStatsLoading(false);
      }
    }

    if (userProfile) {
      void fetchLeetCodeStats();
    }
  }, [userProfile]);

  if (profileLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-gray-400">User not found</div>
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
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-24">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="relative mx-auto mb-6 h-32 w-32">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-50 blur-xl" />
            <img
              src={
                leetcodeStats?.profile.userAvatar ??
                userProfile.image ??
                "/default-avatar.png"
              }
              alt="Profile"
              className="relative h-full w-full rounded-full border-4 border-primary/50 object-cover"
            />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-white">
            {leetcodeStats?.profile.realName ?? userProfile.name}
          </h1>
          <p className="text-lg text-white/60">
            @{userProfile.leetcodeUsername}
          </p>
          {leetcodeStats && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="text-white/60">
                <span className="font-semibold text-white">
                  #{leetcodeStats.profile.ranking.toLocaleString()}
                </span>{" "}
                Global Rank
              </div>
              <div className="text-white/60">
                <span className="font-semibold text-white">
                  {leetcodeStats.profile.reputation}
                </span>{" "}
                Reputation
              </div>
              <div className="text-white/60">
                <span className="font-semibold text-white">
                  {leetcodeStats.userCalendar.streak}
                </span>{" "}
                Day Streak
              </div>
            </div>
          )}
        </motion.div>

        {/* Kanban Layout - Three Columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Column 1: LeetCode Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">LeetCode Stats</h2>

            {/* Total Problems Solved */}
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Problems Solved
              </h3>
              <div className="mb-4 text-center">
                <div className="text-5xl font-bold text-primary">
                  {totalSolved}
                </div>
                <div className="text-sm text-white/40">Total Accepted</div>
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
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Activity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Active Days</span>
                    <span className="font-semibold text-white">
                      {leetcodeStats.userCalendar.totalActiveDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Current Streak</span>
                    <span className="font-semibold text-white">
                      {leetcodeStats.userCalendar.streak} days
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Badges */}
            {leetcodeStats && leetcodeStats.badges.length > 0 && (
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {leetcodeStats.badges.slice(0, 6).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2"
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

          {/* Column 2: Contest Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Contest History</h2>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Participations
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Total Contests</span>
                  <span className="font-semibold text-white">
                    {userProfile.participations?.length ?? 0}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Column 3: Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Account Info</h2>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-white/40">Email</div>
                  <div className="text-white">{userProfile.email}</div>
                </div>
                <div>
                  <div className="text-white/40">LeetCode Username</div>
                  <div className="text-white">
                    @{userProfile.leetcodeUsername}
                  </div>
                </div>
                {userProfile.linkedinUsername && (
                  <div>
                    <div className="text-white/40">LinkedIn</div>
                    <div className="text-white">
                      @{userProfile.linkedinUsername}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
