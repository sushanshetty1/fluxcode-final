"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Code2, Trophy, TrendingUp, Sparkles, ArrowRight, Zap, Target, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    const supabase = createClient();
    
    // Check if user is authenticated
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };
    void fetchUser();
  }, [router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 md:px-8 pt-24 md:pt-32 pb-12 text-center">
        {/* Background Spotlight */}
        <div className="spotlight-purple" />
        <div className="spotlight-blue" />

        <div className="container mx-auto relative z-10 h-full flex flex-col justify-center items-center">
          
          {/* Main Title Area */}
          <motion.div 
            className="relative z-20 flex flex-col items-center gap-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Coding Platform</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/40 leading-[0.9] drop-shadow-2xl"
            >
              FLUX<span className="text-primary">CODE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-2xl text-xl md:text-2xl text-white/70 font-light leading-relaxed text-center tracking-wide"
            >
              Master <span className="text-primary font-semibold">data structures & algorithms</span> through 
              long-term contests with AI-powered guidance and real-time competition
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <Link 
                href="/auth/signin"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary rounded-full overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <span className="font-semibold text-black relative z-10 uppercase tracking-wide text-sm">Start Competing</span>
                <ArrowRight className="h-4 w-4 text-black relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/contests"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                <span className="font-semibold text-white relative z-10 uppercase tracking-wide text-sm">Browse Contests</span>
                <Trophy className="h-4 w-4 text-primary relative z-10" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Why <span className="text-primary">FluxCode</span>?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              A complete platform designed to accelerate your coding journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Trophy className="h-6 w-6 text-primary" />,
                title: "Long-term Contests",
                description: "Join extended coding contests with dynamic topics that evolve as you progress",
                gradient: "from-purple-500/20 to-indigo-500/20"
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-primary" />,
                title: "Track Progress",
                description: "Real-time leaderboards, streak tracking, and comprehensive analytics",
                gradient: "from-indigo-500/20 to-blue-500/20"
              },
              {
                icon: <Brain className="h-6 w-6 text-primary" />,
                title: "AI-Powered Learning",
                description: "Get personalized problem suggestions and motivational coaching",
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: <Zap className="h-6 w-6 text-primary" />,
                title: "Daily Challenges",
                description: "AI-generated problem recommendations based on your skill level",
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: <Target className="h-6 w-6 text-primary" />,
                title: "Topic Mastery",
                description: "Focus on specific DSA topics and track your mastery progress",
                gradient: "from-pink-500/20 to-rose-500/20"
              },
              {
                icon: <Code2 className="h-6 w-6 text-primary" />,
                title: "LeetCode Integration",
                description: "Seamlessly validate your solutions through LeetCode",
                gradient: "from-rose-500/20 to-orange-500/20"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group relative rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-500 hover:bg-white/10 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-12 bg-linear-to-br from-primary/20 to-accent/20 border border-primary/30 overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Level Up Your Coding Skills?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of developers improving their problem-solving abilities
              </p>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform duration-300 uppercase tracking-wide"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
