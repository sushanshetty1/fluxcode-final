"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { usePusher } from "~/hooks/usePusher";
import { useEffect } from "react";

export default function LeaderboardPage() {
  const params = useParams();
  const contestId = params.id as string;

  const { data: leaderboard, isLoading, refetch } = api.leaderboard.getByContest.useQuery({
    contestId,
  });

  const { data: contest } = api.contest.getById.useQuery({ id: contestId });

  const pusher = usePusher();

  useEffect(() => {
    if (pusher) {
      const channel = pusher.subscribe(`contest-${contestId}`);
      channel.bind("leaderboard-update", () => {
        void refetch();
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [pusher, contestId, refetch]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  // Get missed problems count for each user
  const getMissedProblemsCount = (userId: string) => {
    if (!contest) return 0;
    return contest.allUserProgress.filter((up) => up.userId === userId && up.isMissed).length;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/contest/${contestId}`}>
              <h1 className="text-2xl font-bold text-indigo-400">FluxCode</h1>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-white">Leaderboard</h2>

        <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Rank
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    User
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Solved
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Streak
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300 hidden sm:table-cell">
                    Avg Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {leaderboard?.map((entry, index) => {
                  const missedCount = getMissedProblemsCount(entry.userId);
                  return (
                  <tr 
                    key={entry.userId} 
                    className={`${index < 3 ? "bg-yellow-900/20" : ""} ${missedCount > 0 ? "bg-red-900/30 border-l-4 border-l-red-600" : ""}`}
                  >
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4">
                      <span className="text-base sm:text-lg font-semibold text-white">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && index + 1}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-white text-sm sm:text-base">{entry.name}</div>
                          {entry.leetcodeUsername && (
                            <div className="text-xs sm:text-sm text-gray-400">@{entry.leetcodeUsername}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-white">
                      {entry.totalSolved}
                    </td>
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-orange-500">
                      {entry.currentStreak} 🔥
                    </td>
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm text-white hidden sm:table-cell">
                      {entry.averageTime.toFixed(0)}m
                    </td>
                    <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-xs sm:text-sm">
                    {missedCount > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-red-400">⚠️ SHAME ON YOU!</span>
                        <span className="text-xs text-red-300">
                          {missedCount} problem{missedCount > 1 ? "s" : ""} missed - SOLVE IT!
                        </span>
                      </div>
                    ) : (
                      <span className="text-green-400">✓ On Track</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>          </div>
          {(!leaderboard || leaderboard.length === 0) && (
            <div className="py-12 text-center text-gray-400">
              No participants yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
