"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { NavBar } from "~/components/ui/navbar";
import { BentoGrid, BentoGridItem } from "~/components/ui/bento-grid";
import { useRouter } from "next/navigation";
import { Trophy, Users, Calendar, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "~/lib/supabase/client";
import { useEffect, useState } from "react";

export default function Contests() {
  const { data: contests, isLoading } = api.contest.getAll.useQuery();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        
        // Sync user to database first
        await fetch("/api/sync-user", { method: "POST" });
        
        // Fetch user profile to check admin status
        const profileResponse = await fetch(`/api/trpc/user.getProfile?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22userId%22%3A%22${data.user.id}%22%7D%7D%7D`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json() as Array<{ result: { data?: { json?: { isAdmin?: boolean } } } }>;
          setIsAdmin(profileData[0]?.result?.data?.json?.isAdmin ?? false);
        }
      }
    };
    void fetchUser();
  }, []);

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
            <span className="text-sm font-medium text-primary">Active Competitions</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            Live <span className="text-primary">Contests</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Join competitive coding contests and track your progress on the leaderboards
          </p>

          {userId && isAdmin && (
            <Link href="/contests/create">
              <Button className="group bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-6 rounded-full">
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create New Contest
              </Button>
            </Link>
          )}
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
            {contests.map((contest) => (
              <BentoGridItem
                key={contest.id}
                className=""
                title={contest.name}
                description={contest.description ?? "No description available"}
                category="Coding Contest"
                icon={<Trophy className="h-5 w-5 text-primary" />}
                header={
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-purple-500/10 to-transparent" />
                }
                onClick={() => router.push(`/contest/${contest.id}`)}
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
              {isAdmin 
                ? "Be the first to create a contest and challenge the community"
                : "Check back soon for new contests"}
            </p>
          </motion.div>
        )}

        {/* Stats Section */}
        {!isLoading && contests && contests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <div className="rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <Trophy className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-3xl font-bold text-white mb-2">{contests.length}</h3>
              <p className="text-white/60">Active Contests</p>
            </div>
            
            <div className="rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-accent/30 transition-all duration-300 group">
              <Users className="h-10 w-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-3xl font-bold text-white mb-2">
                {contests.reduce((sum, c) => sum + c._count.participants, 0)}
              </h3>
              <p className="text-white/60">Total Participants</p>
            </div>
            
            <div className="rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <Calendar className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-3xl font-bold text-white mb-2">24/7</h3>
              <p className="text-white/60">Always Active</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
