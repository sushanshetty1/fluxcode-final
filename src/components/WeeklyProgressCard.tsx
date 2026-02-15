"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Lock, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Convert problem title to LeetCode URL slug
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

// Check if today is Saturday or Sunday in IST timezone
function isWeekendDay(): boolean {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = istDate.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

interface WeekProblem {
  id: string;
  title: string;
  difficulty: string;
  url?: string;
  titleSlug?: string;
  solved?: boolean;
}

interface WeekData {
  weekNumber: number;
  topic: string;
  weekdayHomework: WeekProblem[];
  weekendTest: {
    problems: WeekProblem[];
    timeLimit: string;
  };
  weekdaySolved: number;
  weekendSolved: number;
  solvedAfterDeadline?: boolean;
}

interface WeeklyProgressCardProps {
  week: WeekData;
  isWeekend: boolean;
  isCollapsed?: boolean;
  showWeekendTest?: boolean; // New prop to control weekend test visibility
  currentWeek?: number; // Current week number to determine if lock should show
  onToggleCollapse?: () => void;
  onVerify?: (problemId: string, problemTitle: string, titleSlug?: string) => Promise<void>;
}

export function WeeklyProgressCard({ week, isWeekend, isCollapsed, showWeekendTest = true, currentWeek, onToggleCollapse, onVerify }: WeeklyProgressCardProps) {
  const isWeekendToday = isWeekendDay();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const successMessages = [
    "Wow, you actually did it! 🎉",
    "Look at you go, showing off! 💪",
    "Congratulations! Your streak is still alive... for now 😏",
    "Nice! Now do 10 more 😈",
    "Verified! Mom would be proud 🥺",
    "Achievement unlocked: Actually Coding 🏆",
    "LeetCode: ✅ | Grass: ❌",
    "Grinded! Now take a break... JK, NEXT PROBLEM! 🔥",
  ];

  const errorMessages = [
    "Bruh... did you even solve it? 💀",
    "LeetCode says no lol 😂",
    "Nice try, but that's a no from LeetCode 🙅",
    "Error 404: Solution not found 🤡",
    "LeetCode rejected you faster than your ex 💔",
    "Oops! Time to actually solve the problem 😬",
    "Did you copy-paste from ChatGPT? LeetCode knows 🤖",
    "Task failed successfully ❌",
  ];

  const handleVerify = async (problemId: string, problemTitle: string, titleSlug?: string) => {
    if (!onVerify) return;
    
    try {
      await onVerify(problemId, problemTitle, titleSlug);
      const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
      toast.success(randomSuccess, {
        description: `${problemTitle} verified! Your progress has been updated.`,
      });
    } catch (error) {
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      toast.error(randomError, {
        description: error instanceof Error ? error.message : "Unable to verify the problem. Please try again.",
      });
    }
  };

  // Determine weekend test status color
  const getWeekendColor = () => {
    const solved = week.weekendSolved;
    // If previous week and solved after deadline, always show red
    if (currentWeek !== undefined && week.weekNumber < currentWeek && week.solvedAfterDeadline) {
      return "bg-red-500/10 border-red-500/30";
    }
    if (solved === 0 || solved === 1) return "bg-red-500/10 border-red-500/30";
    if (solved === 2) return "bg-yellow-500/10 border-yellow-500/30";
    if (solved === 3) return "bg-green-500/10 border-green-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getWeekendTextColor = () => {
    const solved = week.weekendSolved;
    // If previous week and solved after deadline, always show red
    if (currentWeek !== undefined && week.weekNumber < currentWeek && week.solvedAfterDeadline) {
      return "text-red-400";
    }
    if (solved === 0 || solved === 1) return "text-red-400";
    if (solved === 2) return "text-yellow-400";
    if (solved === 3) return "text-green-400";
    return "text-red-400";
  };

  return (
    <Card className="border-primary/20 bg-black/50 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">
              Week {week.weekNumber}
            </h3>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="rounded-lg p-1 hover:bg-white/10 transition-colors"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-400">{week.topic}</p>
        </div>
        <Badge className="bg-primary/20 text-primary">
          {week.weekdaySolved + week.weekendSolved}/{week.weekdayHomework.length + week.weekendTest.problems.length} Solved
        </Badge>
      </div>

      {!isCollapsed && (
        <>
          {/* Weekday Homework - Always Blue */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="font-semibold text-white">Weekday Homework</span>
          <span className="text-sm text-white/60">
            ({week.weekdaySolved}/{week.weekdayHomework.length} solved)
          </span>
        </div>
        <div className="ml-5 space-y-2">
          {week.weekdayHomework.map((problem) => (
            <div
              key={problem.id}
              className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-white truncate">{problem.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Desktop view - all badges visible */}
                <div className="hidden sm:flex items-center gap-2">
                  <Badge
                    className={
                      problem.difficulty === "Easy"
                        ? "bg-green-500/20 text-green-400 text-xs"
                        : problem.difficulty === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400 text-xs"
                          : "bg-red-500/20 text-red-400 text-xs"
                    }
                  >
                    {problem.difficulty}
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                    +10 pts
                  </Badge>
                  <a
                    href={problem.url ?? `https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer text-xs">
                      Link
                    </Badge>
                  </a>
                  <button
                    onClick={() => handleVerify(problem.id, problem.title, problem.titleSlug)}
                    disabled={!onVerify || problem.solved}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Badge className={problem.solved ? "bg-green-500/20 text-green-400 text-xs" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs"}>
                      {problem.solved ? 'Verified' : 'Verify'}
                    </Badge>
                  </button>
                  {problem.solved && (
                    <span className="text-primary">✓</span>
                  )}
                </div>

                {/* Mobile view - dropdown menu */}
                <div className="sm:hidden relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === problem.id ? null : problem.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                  {openDropdown === problem.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-xl p-2 min-w-40">
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <Badge
                            className={
                              problem.difficulty === "Easy"
                                ? "bg-green-500/20 text-green-400 text-xs"
                                : problem.difficulty === "Medium"
                                  ? "bg-yellow-500/20 text-yellow-400 text-xs"
                                  : "bg-red-500/20 text-red-400 text-xs"
                            }
                          >
                            {problem.difficulty}
                          </Badge>
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            +10 pts
                          </Badge>
                        </div>
                        <a
                          href={problem.url ?? `https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-2 py-1.5 text-sm text-blue-400 hover:bg-white/5 rounded transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          Open in LeetCode
                        </a>
                        <button
                          onClick={() => {
                            void handleVerify(problem.id, problem.title, problem.titleSlug);
                            setOpenDropdown(null);
                          }}
                          disabled={!onVerify || problem.solved}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                        >
                          <span className={problem.solved ? "text-green-400" : "text-purple-400"}>
                            {problem.solved ? '✓ Verified' : 'Verify Solution'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekend Test - Show for all weeks, lock only current week */}
      {showWeekendTest && (
        <div className="relative">
          {/* Blur overlay when not weekend - only for current week */}
          {!isWeekendToday && currentWeek === week.weekNumber && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-md">
              <div className="flex flex-col items-center gap-2 text-white">
                <Lock className="h-8 w-8" />
                <p className="text-sm font-semibold">Available on Weekends</p>
                <p className="text-xs text-white/60">Saturday & Sunday</p>
              </div>
            </div>
          )}
          <div className="mb-2 flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              // If previous week and solved after deadline, always red
              currentWeek !== undefined && week.weekNumber < currentWeek && week.solvedAfterDeadline
                ? "bg-red-500"
                : week.weekendSolved === 0 || week.weekendSolved === 1
                ? "bg-red-500"
                : week.weekendSolved === 2
                  ? "bg-yellow-500"
                  : week.weekendSolved === 3
                    ? "bg-green-500"
                    : "bg-red-500"
            }`}
          />
          <span className="font-semibold text-white">Weekend Test</span>
          <span className={`text-sm ${getWeekendTextColor()}`}>
            ({week.weekendSolved}/{week.weekendTest.problems.length} solved)
          </span>
          {/* Show Risk badge only for current week */}
          {currentWeek === week.weekNumber && week.weekendSolved < 2 && isWeekend && (
            <Badge className="bg-red-500/20 text-red-400">⚠️ Risk</Badge>
          )}
          {/* Roast for previous weeks */}
          {currentWeek !== undefined && week.weekNumber < currentWeek && (
            week.solvedAfterDeadline ? (
              // If solved after deadline, always show Money Gone
              <Badge className="bg-red-500/20 text-red-400">💸 Money Gone!</Badge>
            ) : week.weekendSolved < 2 ? (
              // Didn't solve 2/3 on time
              <Badge className="bg-red-500/20 text-red-400">💸 Money Gone!</Badge>
            ) : week.weekendSolved === 2 ? (
              // 2/3 solved on time
              <Badge className="bg-yellow-500/20 text-yellow-400">😅 Close Call!</Badge>
            ) : (
              // 3/3 solved on time
              <Badge className="bg-green-500/20 text-green-400">✨ Perfect!</Badge>
            )
          )}
          {/* For current week - completed status */}
          {currentWeek === week.weekNumber && week.weekendSolved === 2 && (
            <Badge className="bg-yellow-500/20 text-yellow-400">😅 2/3 - Saved!</Badge>
          )}
          {currentWeek === week.weekNumber && week.weekendSolved === 3 && (
            <Badge className="bg-green-500/20 text-green-400">✨ Perfect!</Badge>
          )}
        </div>
        <div className="ml-5 space-y-2">
          {week.weekendTest.problems.map((problem) => {
            // Only hide content for current week when not weekend
            const shouldHide = !isWeekendToday && currentWeek === week.weekNumber;
            
            return (
              <div
                key={problem.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 gap-2 ${getWeekendColor()}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-sm ${shouldHide ? 'invisible' : 'text-white truncate'}`}>{problem.title}</span>
                </div>
                <div className={`flex items-center gap-2 shrink-0 ${shouldHide ? 'invisible' : ''}`}>
                  {/* Desktop view - all badges visible */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge
                      className={
                        problem.difficulty === "Easy"
                          ? "bg-green-500/20 text-green-400 text-xs"
                          : problem.difficulty === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 text-xs"
                            : "bg-red-500/20 text-red-400 text-xs"
                      }
                    >
                      {problem.difficulty}
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                      +20 pts
                    </Badge>
                    <a
                      href={problem.url ?? `https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer text-xs">
                        Link
                      </Badge>
                    </a>
                    <button
                      onClick={() => handleVerify(problem.id, problem.title, problem.titleSlug)}
                      disabled={(!onVerify || problem.solved)}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Badge className={problem.solved ? "bg-green-500/20 text-green-400 text-xs" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs"}>
                        {problem.solved ? 'Verified' : 'Verify'}
                      </Badge>
                    </button>
                    {problem.solved && (
                      <span className="text-green-400">✓</span>
                    )}
                  </div>

                  {/* Mobile view - dropdown menu */}
                  <div className="sm:hidden relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === problem.id ? null : problem.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    {openDropdown === problem.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-xl p-2 min-w-40">
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <Badge
                              className={
                                problem.difficulty === "Easy"
                                  ? "bg-green-500/20 text-green-400 text-xs"
                                  : problem.difficulty === "Medium"
                                    ? "bg-yellow-500/20 text-yellow-400 text-xs"
                                    : "bg-red-500/20 text-red-400 text-xs"
                              }
                            >
                              {problem.difficulty}
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                              +20 pts
                            </Badge>
                          </div>
                          <a
                            href={problem.url ?? `https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-2 py-1.5 text-sm text-blue-400 hover:bg-white/5 rounded transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            Open in LeetCode
                          </a>
                          <button
                            onClick={() => {
                              void handleVerify(problem.id, problem.title, problem.titleSlug);
                              setOpenDropdown(null);
                            }}
                            disabled={(!onVerify || problem.solved)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                          >
                            <span className={problem.solved ? "text-green-400" : "text-purple-400"}>
                              {problem.solved ? '✓ Verified' : 'Verify Solution'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Time Limit: {week.weekendTest.timeLimit}</span>
            {week.weekendSolved < 2 && (
              <span className="text-red-400">
                Need 2/3 to avoid penalty
              </span>
            )}
          </div>
        </div>
      </div>
      )}
        </>
      )}
    </Card>
  );
}
