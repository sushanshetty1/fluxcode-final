"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

function OnboardingInner() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [linkedinUsername, setLinkedinUsername] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        // Sync user to database
        await fetch("/api/sync-user", { method: "POST" });
      } else {
        router.push("/auth/signin");
      }
    };
    void fetchUser();
  }, [router]);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      router.push("/contests");
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      setValidationError("Failed to update profile. Please try again.");
    },
  });

  const validateLeetCode = async () => {
    if (!leetcodeUsername) {
      return;
    }
    setIsValidating(true);
    setValidationError("");
    try {
      const response = await fetch(`/api/validate-leetcode?username=${encodeURIComponent(leetcodeUsername)}`);
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setIsValid(data.valid);
      if (!data.valid) {
        setValidationError("Can't find LeetCode username. Please check and try again.");
      }
    } catch {
      setIsValid(false);
      setValidationError("Can't find LeetCode username. Please check and try again.");
    }
    setIsValidating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.error("No user ID available");
      return;
    }
    updateProfile.mutate({
      userId,
      linkedinUsername,
      leetcodeUsername,
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden flex items-center justify-center px-4">
      {/* Background Spotlights */}
      <div className="spotlight-purple" />
      <div className="spotlight-blue" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Complete Your Profile</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4"
          >
            Welcome to <span className="text-primary">FluxCode</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-white/60 text-base sm:text-lg px-4"
          >
            We need a few more details to get you started
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-white/80 mb-2">
                LinkedIn Username *
              </label>
              <input
                id="linkedin"
                type="text"
                required
                value={linkedinUsername}
                onChange={(e) => setLinkedinUsername(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 text-white px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="johndoe"
              />
              <p className="mt-2 text-xs text-white/40">
                Your LinkedIn profile username
              </p>
            </div>

            <div>
              <label htmlFor="leetcode" className="block text-sm font-medium text-white/80 mb-2">
                LeetCode Username *
              </label>
              <div className="flex gap-3">
                <input
                  id="leetcode"
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => {
                    setLeetcodeUsername(e.target.value);
                    setIsValid(false);
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 text-white px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="johndoe"
                />
                <Button
                  type="button"
                  onClick={validateLeetCode}
                  disabled={isValidating || !leetcodeUsername}
                  className="rounded-2xl px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white"
                >
                  {isValidating ? "..." : "Verify"}
                </Button>
              </div>
              {isValid && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-2 text-sm text-primary flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Valid LeetCode username
                </motion.p>
              )}
              {validationError && (
                <p className="mt-2 text-sm text-red-500">{validationError}</p>
              )}
              {leetcodeUsername && !isValidating && !isValid && !validationError && leetcodeUsername.length > 0 && (
                <p className="mt-2 text-sm text-white/60">Click Verify to check username</p>
              )}
              <p className="mt-2 text-xs text-white/40">
                Required for problem verification
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold px-8 py-6 rounded-full uppercase tracking-wide transition-all hover:scale-[1.02]"
              disabled={updateProfile.isPending || !isValid || !linkedinUsername || !leetcodeUsername}
            >
              {updateProfile.isPending ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
