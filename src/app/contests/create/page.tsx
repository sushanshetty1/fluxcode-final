"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";

const DIFFICULTY_SYLLABI = [
  { value: "beginner", label: "Beginner (9 months)", duration: "36 weeks" },
  { value: "intermediate", label: "Intermediate (6 months)", duration: "24 weeks" },
  { value: "advanced", label: "Advanced (5 months)", duration: "20 weeks" },
];

export default function CreateContest() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [startDate, setStartDate] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; name: string; email: string; leetcodeUsername: string }>>([]);

  // Fetch users for search
  const { data: allUsers } = api.user.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const createContest = api.contest.createWithDifficulty.useMutation({
    onSuccess: (data) => {
      router.push(`/contest/${data.id}`);
    },
  });

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.push("/auth/signin");
      }
      setIsLoading(false);
    };
    void fetchUser();
  }, [router]);

  // Get all Sundays for the next 6 months
  const getSundays = () => {
    const sundays: string[] = [];
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const current = new Date(today);
    current.setDate(current.getDate() + ((7 - current.getDay()) % 7));

    while (current <= sixMonthsLater) {
      sundays.push(current.toISOString().split("T")[0]!);
      current.setDate(current.getDate() + 7);
    }

    return sundays;
  };

  const availableSundays = getSundays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    createContest.mutate({
      userId,
      name,
      description,
      difficulty,
      startDate: new Date(startDate),
      penaltyAmount,
      invitedUserIds: selectedUsers.map(u => u.id),
    });
  };

  const addUser = (user: { id: string; name: string | null; email: string | null; leetcodeUsername: string | null }) => {
    if (!selectedUsers.find(u => u.id === user.id) && user.name && user.email && user.leetcodeUsername) {
      setSelectedUsers([...selectedUsers, {
        id: user.id,
        name: user.name,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
      }]);
    }
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <h1 className="mb-8 text-4xl font-bold text-white">
            Create New Contest
          </h1>

          <Card className="border-purple-500/20 bg-black/50 p-8 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contest Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Contest Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., DSA Mastery 2026"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Brief description of the contest..."
                  rows={3}
                />
              </div>

              {/* Difficulty Dropdown */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  {DIFFICULTY_SYLLABI.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label} - {diff.duration}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-400">
                  This determines the curriculum and duration of the contest
                </p>
              </div>

              {/* Sunday Date Picker */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Start Date (Sundays Only)
                </label>
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Select a Sunday...</option>
                  {availableSundays.map((sunday) => (
                    <option key={sunday} value={sunday}>
                      {new Date(sunday).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-400">
                  Contests must start on a Sunday
                </p>
              </div>

              {/* Penalty Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Penalty Amount (₹)
                </label>
                <input
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="100"
                  min="1"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  Amount charged for entry and penalties if weekend tests are
                  failed
                </p>
              </div>

              {/* User Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Invite Participants
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-purple-500/20 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    placeholder="Search by name, email, or LeetCode username..."
                  />
                  {searchQuery.length > 2 && allUsers && allUsers.length > 0 && (
                    <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-purple-500/20 bg-black/95 shadow-xl">
                      {allUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addUser(user)}
                          className="w-full border-b border-purple-500/10 px-4 py-3 text-left text-white transition-colors hover:bg-purple-500/10"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-400">
                            @{user.leetcodeUsername} • {user.email}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">
                      Selected Participants ({selectedUsers.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2"
                          >
                            <span className="text-sm text-white">
                              {user.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeUser(user.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createContest.isPending}
                  className="flex-1 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {createContest.isPending ? "Creating..." : "Create Contest"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/contests")}
                  className="rounded-lg border border-purple-500/20 bg-black/50 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500/10"
                >
                  Cancel
                </Button>
              </div>

              {createContest.error && (
                <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
                  Error: {createContest.error.message}
                </div>
              )}
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
