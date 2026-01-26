"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/signin");
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const { data: stats } = api.progress.getStats.useQuery(undefined, { enabled: !!user });
  const { data: recentActivity } = api.progress.getRecentActivity.useQuery({ limit: 10 }, { enabled: !!user });
  const { data: achievements } = api.user.getAchievements.useQuery(undefined, { enabled: !!user });
  const { data: streak } = api.user.getStreak.useQuery(undefined, { enabled: !!user });

  if (loading || !user || !stats || !recentActivity || !achievements) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-indigo-400">FluxCode</h1>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-300 hover:text-white">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          {user.user_metadata?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.name ?? "User"}
              className="h-24 w-24 rounded-full"
            />
          )}
          <div>
            <h2 className="text-3xl font-bold text-white">{user.user_metadata?.name ?? user.email}</h2>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-gray-800 p-6 shadow">
              <h3 className="mb-4 text-xl font-bold text-white">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Total Solved</div>
                  <div className="text-3xl font-bold text-white">{stats.totalSolved}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Current Streak</div>
                  <div className="text-3xl font-bold text-orange-500">
                    {stats.currentStreak} 🔥
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Longest Streak</div>
                  <div className="text-2xl font-bold text-white">{stats.longestStreak}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Streak Freezes</div>
                  <div className="text-2xl font-bold text-white">{streak?.freezesLeft ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6 shadow">
              <h3 className="mb-4 text-xl font-bold text-white">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between border-b border-gray-700 pb-2">
                    <div>
                      <div className="font-medium text-white">{activity.problem.title}</div>
                      <div className="text-sm text-gray-400">{activity.topic.name}</div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {activity.completedAt?.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Achievements</h3>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.badge.icon ?? "🏆"}</span>
                    <div>
                      <div className="font-medium text-gray-900">{achievement.badge.name}</div>
                      <div className="text-xs text-gray-500">{achievement.badge.description}</div>
                    </div>
                  </div>
                ))}
                {achievements.length === 0 && (
                  <p className="text-gray-500">No achievements yet</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Progress by Topic</h3>
              <div className="space-y-3">
                {stats.topicStats.map((topic) => (
                  <div key={topic.topicName} className="flex justify-between">
                    <span className="text-gray-600">{topic.topicName}</span>
                    <span className="font-semibold">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
