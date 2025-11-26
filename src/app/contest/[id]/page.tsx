/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ContestPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const { data: session } = useSession();

  const { data: contest, isLoading, refetch } = api.contest.getById.useQuery({ id: contestId });
  const { data: suggestions } = api.admin.getDailySuggestions.useQuery({ contestId });
  const { data: canStartNext } = api.admin.canStartNextTopic.useQuery({ contestId });
  const generateSuggestion = api.admin.generateDailySuggestion.useMutation();
  const applySuggestion = api.admin.applySuggestion.useMutation();
  const joinContest = api.contest.join.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const startNextTopic = api.admin.startNextTopic.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const verifyMutation = api.problem.verify.useMutation({
    onSuccess: () => {
      void refetch();
      setVerifying(null);
    },
    onError: (error) => {
      alert(error.message);
      setVerifying(null);
    },
  });

  const handleVerify = (problemId: string) => {
    if (!session?.user.leetcodeUsername) {
      alert("Please add your LeetCode username in your profile");
      return;
    }
    setVerifying(problemId);
    verifyMutation.mutate({
      problemId,
      leetcodeUsername: session.user.leetcodeUsername,
    });
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!contest) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Contest not found</div>;
  }

  const currentUserId = session?.user?.id;
  const isParticipant = contest.participants.some((p) => p.userId === currentUserId);
  const isCreator = contest.creatorId === currentUserId;

  // Calculate available problems based on difficulty and days
  const getAvailableProblems = () => {
    if (!contest.startDate) return [];
    
    const availableProblems: Array<{
      problemId: string;
      isAvailableToday: boolean;
      unlockDay: number;
      problem: typeof contest.topics[0]['problems'][0];
    }> = [];
    
    for (const topic of contest.topics) {
      // Only process topics that have been started
      if (!topic.hasStarted || !topic.topicStartedAt) {
        continue;
      }

      const topicStartDate = new Date(topic.topicStartedAt);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - topicStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Sort problems by difficulty for proper unlocking
      const easyProblems = topic.problems.filter(p => p.difficulty === 'Easy');
      const mediumProblems = topic.problems.filter(p => p.difficulty === 'Medium');
      const hardProblems = topic.problems.filter(p => p.difficulty === 'Hard');
      
      // Easy: 2 per day
      for (let i = 0; i < easyProblems.length; i++) {
        const problem = easyProblems[i];
        if (!problem) continue;
        const unlockDay = Math.floor(i / 2);
        availableProblems.push({
          problemId: problem.id,
          isAvailableToday: daysSinceStart >= unlockDay,
          unlockDay,
          problem,
        });
      }
      
      // Medium: 1 per day
      const mediumStartDay = Math.ceil(easyProblems.length / 2);
      for (let i = 0; i < mediumProblems.length; i++) {
        const problem = mediumProblems[i];
        if (!problem) continue;
        const unlockDay = mediumStartDay + i;
        availableProblems.push({
          problemId: problem.id,
          isAvailableToday: daysSinceStart >= unlockDay,
          unlockDay,
          problem,
        });
      }
      
      // Hard: 1 every 2 days
      const hardStartDay = mediumStartDay + mediumProblems.length;
      for (let i = 0; i < hardProblems.length; i++) {
        const problem = hardProblems[i];
        if (!problem) continue;
        const unlockDay = hardStartDay + (i * 2);
        availableProblems.push({
          problemId: problem.id,
          isAvailableToday: daysSinceStart >= unlockDay,
          unlockDay,
          problem,
        });
      }
    }
    
    return availableProblems;
  };

  // Get today's problems
  const getTodaysProblems = () => {
    // Find active topic that has been started
    const activeTopic = contest.topics.find((t) => t.isActive && t.hasStarted);
    if (!activeTopic || !activeTopic.topicStartedAt) return { problems: [], completedCount: 0, totalCount: 0, dayNumber: 0, hoursUntilNext: 0 };
    
    const startDate = new Date(activeTopic.topicStartedAt);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const availableProblems = getAvailableProblems();
    const todaysProblems = availableProblems.filter(p => 
      p.unlockDay === daysSinceStart && p.isAvailableToday
    );
    
    const completedCount = todaysProblems.filter(p =>
      contest.userProgress?.some(
        (up: { problemId: string; completed: boolean }) => up.problemId === p.problemId && up.completed
      )
    ).length;
    
    // Calculate next unlock time
    const tomorrow = new Date(startDate);
    tomorrow.setDate(tomorrow.getDate() + daysSinceStart + 1);
    const hoursUntilNext = Math.max(0, Math.floor((tomorrow.getTime() - today.getTime()) / (1000 * 60 * 60)));
    
    return {
      problems: todaysProblems,
      completedCount,
      totalCount: todaysProblems.length,
      dayNumber: daysSinceStart + 1,
      hoursUntilNext,
    };
  };

  const todaysData = getTodaysProblems();
  const availableProblems = getAvailableProblems();
  
  // Check if there's an active topic that has started
  const activeTopicStarted = contest.topics.some((t) => t.isActive && t.hasStarted);

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-indigo-400">FluxCode</h1>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">{contest.name}</h2>
          <p className="mt-2 text-gray-400">{contest.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Created by {contest.creator.name}
            </span>
            <span className="text-sm text-gray-400">
              {contest.participants.length} participants
            </span>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          {!isParticipant && (
            <div className="flex flex-col gap-2">
              {contest.password && !showPasswordInput && (
                <Button
                  onClick={() => setShowPasswordInput(true)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Enter Password to Join
                </Button>
              )}
              {(!contest.password || showPasswordInput) && (
                <div className="flex gap-2">
                  {contest.password && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter contest password"
                      className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-400"
                    />
                  )}
                  <Button
                    onClick={() => joinContest.mutate({ contestId, password: contest.password ? password : undefined })}
                    disabled={joinContest.isPending || Boolean(contest.password && !password)}
                  >
                    {joinContest.isPending ? "Joining..." : "Join Contest"}
                  </Button>
                </div>
              )}
            </div>
          )}
          {isCreator && canStartNext?.canStart && (
            <Button
              onClick={() => startNextTopic.mutate({ contestId })}
              disabled={startNextTopic.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {startNextTopic.isPending ? "Starting..." : "Start Topic"}
            </Button>
          )}
          <Link href={`/contest/${contestId}/leaderboard`}>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">View Leaderboard</Button>
          </Link>
        </div>

        {activeTopicStarted && todaysData.problems.length > 0 && (
          <div className="mb-8 rounded-lg bg-linear-to-r from-indigo-900/50 to-purple-900/50 p-6 border border-indigo-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Today&apos;s Challenges - Day {todaysData.dayNumber}</h3>
                <p className="text-sm text-gray-300">{todaysData.completedCount} of {todaysData.totalCount} completed</p>
              </div>
              {todaysData.completedCount === todaysData.totalCount && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-300">
                  ✓ All Completed
                </span>
              )}
            </div>
            
            <div className="space-y-3 mb-4">
              {todaysData.problems.map((p) => {
                const isCompleted = contest.userProgress?.some(
                  (up: { problemId: string; completed: boolean }) => up.problemId === p.problemId && up.completed
                );
                const isVerifying = verifying === p.problemId;
                return (
                  <div key={p.problemId} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={p.problem.hyperlink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-indigo-400 hover:underline text-lg"
                          >
                            {p.problem.title}
                          </a>
                          {isCompleted && (
                            <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-300">✓ Solved</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            p.problem.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                            p.problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {p.problem.difficulty}
                          </span>
                          {p.problem.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link href={p.problem.hyperlink} target="_blank">
                        <Button size="sm">Check</Button>
                      </Link>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleVerify(p.problemId)}
                          disabled={isVerifying}
                        >
                          {isVerifying ? "Verifying..." : "Check"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-800/30 rounded p-3">
              <p className="text-gray-400 text-sm mb-1">Next Challenge Unlocks In</p>
              <p className="text-white font-medium text-lg">{todaysData.hoursUntilNext} hours</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white">Topics & Problems</h3>
          {contest.topics.map((topic) => {
            // Only show unlocked problems if topic has been started
            const topicProblems = topic.hasStarted 
              ? availableProblems.filter(p => topic.problems.some(tp => tp.id === p.problemId))
              : [];
            const availableCount = topicProblems.filter(p => p.isAvailableToday).length;
            const lockedCount = topic.hasStarted 
              ? topicProblems.filter(p => !p.isAvailableToday).length
              : topic.problems.length;
            
            return (
              <div key={topic.id} className="rounded-lg bg-gray-800 p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-semibold text-white">{topic.name}</h4>
                      {topic.isActive && (
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold">
                          ACTIVE
                        </span>
                      )}
                      {topic.topicCompletedAt && (
                        <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{topic.description}</p>
                    {topic.topicStartedAt && (
                      <div className="mt-2 flex gap-4 text-sm text-gray-400">
                        <span>
                          Started: {new Date(topic.topicStartedAt).toLocaleDateString()}
                        </span>
                        {topic.topicCompletedAt ? (
                          <span className="text-green-400">
                            Completed in {Math.floor((new Date(topic.topicCompletedAt).getTime() - new Date(topic.topicStartedAt).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        ) : topic.isActive && (
                          <span className="text-indigo-400">
                            {Math.floor((new Date().getTime() - new Date(topic.topicStartedAt).getTime()) / (1000 * 60 * 60 * 24))} days elapsed
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      {topic.subcategories.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-full bg-indigo-900 px-3 py-1 text-xs text-indigo-300"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {availableCount}/{topic.problems.length}
                    </div>
                    <div className="text-sm text-gray-400">Unlocked</div>
                    {lockedCount > 0 && (
                      <div className="text-xs text-red-400 mt-1">🔒 {lockedCount} locked</div>
                    )}
                  </div>
                </div>
                
                {availableCount > 0 && (
                  <div className="mt-4">
                    <Link href={`/contest/${contestId}/topic/${topic.id}`}>
                      <Button>View Problems</Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isCreator && (
          <div className="mt-8 rounded-lg bg-gray-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">AI Suggestions</h3>
            <Button 
              onClick={() => generateSuggestion.mutate({ contestId })}
              disabled={generateSuggestion.isPending}
              className="mb-4"
            >
              {generateSuggestion.isPending ? "Generating..." : "Generate Daily Suggestion"}
            </Button>
            
            {suggestions && suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-700 rounded p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{suggestion.topicName}</h4>
                        <p className="text-sm text-gray-400 mt-1">{suggestion.reasoning}</p>
                        <div className="mt-2 flex gap-2">
                          {suggestion.subcategories.map((sub: string) => (
                            <span key={sub} className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded">
                              {sub}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Difficulty: <span className="text-yellow-400">{suggestion.difficulty}</span></p>
                      </div>
                      {!suggestion.isApplied && (
                        <Button
                          size="sm"
                          onClick={() => applySuggestion.mutate({ suggestionId: suggestion.id })}
                          disabled={applySuggestion.isPending}
                        >
                          {applySuggestion.isPending ? "Applying..." : "Apply"}
                        </Button>
                      )}
                      {suggestion.isApplied && (
                        <span className="text-sm text-green-400">Applied ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
