"use client";

import { createClient } from "~/lib/supabase/client";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Code2, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function SignIn() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in:', error.message);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background Effects */}
      <div className="spotlight-purple" />
      <div className="spotlight-blue" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Code2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">
              <span className="text-white">FLUX</span>
              <span className="text-primary">CODE</span>
            </h1>
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Master DSA Through <span className="text-primary">Competition</span>
          </h2>
          
          <p className="text-xl text-white/60 mb-8 leading-relaxed">
            Join long-term contests, compete on leaderboards, and accelerate your coding journey with AI-powered guidance
          </p>

          <div className="space-y-4">
            {[
              { icon: <Trophy className="h-5 w-5 text-primary" />, text: "Long-term competitive contests" },
              { icon: <TrendingUp className="h-5 w-5 text-primary" />, text: "Real-time progress tracking" },
              { icon: <Sparkles className="h-5 w-5 text-primary" />, text: "AI-powered learning paths" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  {feature.icon}
                </div>
                <span className="text-white/80">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 shadow-2xl">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2 justify-center mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-white">FLUX</span>
                <span className="text-primary">CODE</span>
              </h1>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-3">Welcome Back</h3>
              <p className="text-white/60">
                Sign in to continue your coding journey
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full h-14 text-base normal-case"
                size="lg"
              >
                <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-white/40">Secure Authentication</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-white/40 mt-8">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </Link>
            </p>
          </div>

          <p className="text-center text-white/40 mt-6 text-sm">
            Don't have an account? Sign in to get started
          </p>
        </motion.div>
      </div>
    </div>
  );
}
