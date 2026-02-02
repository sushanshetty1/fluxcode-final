"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { NavBar } from "~/components/ui/navbar";
import { motion } from "framer-motion";
import { Trophy, Users, Sparkles, TrendingUp } from "lucide-react";
import { api } from "~/trpc/react";
import { BentoGrid, BentoGridItem } from "~/components/ui/bento-grid";

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const { data: contests, isLoading } = api.contest.getAll.useQuery();
  const { data: userProfile } = api.user.getProfile.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        void router.push("/auth/signin");
      } else {
        setUserId(user.id);
      }
    };

    void checkAuth();
  }, [router]);

  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      void router.push("/contests");
    }
  }, [userProfile, router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Your Dashboard</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white">
            Contest <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Track your progress across all contests
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Contests Grid */}
        {!isLoading && contests && contests.length > 0 && (
          <BentoGrid className="mb-12">
            {contests.map((contest, idx) => (
              <BentoGridItem
                key={contest.id}
                className={idx % 5 === 0 ? "md:col-span-2" : ""}
                title={contest.name}
                description={contest.description ?? "No description available"}
                category="Coding Contest"
                icon={<Trophy className="h-5 w-5 text-primary" />}
                header={
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-purple-500/10 to-transparent" />
                }
                onClick={() => router.push(`/dashboard/${contest.id}`)}
              />
            ))}
          </BentoGrid>
        )}

        {/* Empty State */}
        {!isLoading && contests?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-6 rounded-3xl bg-white/5 border border-white/10 mb-6">
              <Trophy className="h-16 w-16 text-primary/50" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Contests Available</h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Join a contest to start tracking your progress
            </p>
          </motion.div>
        )}

        {/* Stats Section */}
        {!isLoading && contests && contests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">{contests.length}</h3>
              <p className="text-white/60 text-xs sm:text-sm">Total Contests</p>
            </div>
            
            <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-accent/30 transition-all duration-300 group">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-accent mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                {contests.filter(c => c.creator.id === userId).length}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm">Contests Created</p>
            </div>
            
            <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                {contests.reduce((sum, c) => sum + c._count.participants, 0)}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm">Total Participants</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

