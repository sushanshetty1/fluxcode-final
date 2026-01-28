"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Lock } from "lucide-react";
import { toast } from "sonner";

// Convert problem title to LeetCode URL slug
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

// Check if today is Saturday or Sunday
function isWeekendDay(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

interface WeekProblem {
  id: string;
  title: string;
  difficulty: string;
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
}

interface WeeklyProgressCardProps {
  week: WeekData;
  isWeekend: boolean;
  onVerify?: (problemId: string, problemTitle: string) => Promise<void>;
}

export function WeeklyProgressCard({ week, isWeekend, onVerify }: WeeklyProgressCardProps) {
  const isWeekendToday = isWeekendDay();

  const handleVerify = async (problemId: string, problemTitle: string) => {
    if (!onVerify) return;
    
    try {
      await onVerify(problemId, problemTitle);
      toast.success(`${problemTitle} verified successfully!`, {
        description: "Your progress has been updated.",
      });
    } catch (error) {
      toast.error("Verification failed", {
        description: error instanceof Error ? error.message : "Unable to verify the problem. Please try again.",
      });
    }
  };

  // Determine weekend test status color
  const getWeekendColor = () => {
    const solved = week.weekendSolved;
    if (solved === 0 || solved === 1) return "bg-red-500/10 border-red-500/30";
    if (solved === 2) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-green-500/10 border-green-500/30";
  };

  const getWeekendTextColor = () => {
    const solved = week.weekendSolved;
    if (solved === 0 || solved === 1) return "text-red-400";
    if (solved === 2) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className="border-primary/20 bg-black/50 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            Week {week.weekNumber}
          </h3>
          <p className="text-sm text-gray-400">{week.topic}</p>
        </div>
        <Badge className="bg-primary/20 text-primary">
          {week.weekdaySolved + week.weekendSolved}/6 Solved
        </Badge>
      </div>

      {/* Weekday Homework - Always Blue */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="font-semibold text-white">Weekday Homework</span>
          <span className="text-sm text-white/60">
            ({week.weekdaySolved}/3 solved)
          </span>
        </div>
        <div className="ml-5 space-y-2">
          {week.weekdayHomework.map((problem) => (
            <div
              key={problem.id}
              className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
            >
              <span className="text-sm text-white">{problem.title}</span>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    problem.difficulty === "Easy"
                      ? "bg-green-500/20 text-green-400"
                      : problem.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }
                >
                  {problem.difficulty}
                </Badge>
                <a
                  href={`https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer">
                    Link
                  </Badge>
                </a>
                <button
                  onClick={() => handleVerify(problem.id, problem.title)}
                  disabled={!onVerify || problem.solved}
                  className="cursor-pointer disabled:cursor-not-allowed"
                >
                  <Badge className={problem.solved ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"}>
                    {problem.solved ? 'Verified' : 'Verify'}
                  </Badge>
                </button>
                {problem.solved && (
                  <span className="text-primary">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekend Test - Color Coded */}
      <div className="relative">
        {/* Blur overlay when not weekend */}
        {!isWeekendToday && (
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
              week.weekendSolved === 0 || week.weekendSolved === 1
                ? "bg-red-500"
                : week.weekendSolved === 2
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          />
          <span className="font-semibold text-white">Weekend Test</span>
          <span className={`text-sm ${getWeekendTextColor()}`}>
            ({week.weekendSolved}/3 solved)
          </span>
          {week.weekendSolved < 2 && isWeekend && (
            <Badge className="bg-red-500/20 text-red-400">⚠️ Risk</Badge>
          )}
        </div>
        <div className="ml-5 space-y-2">
          {week.weekendTest.problems.map((problem) => (
            <div
              key={problem.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${getWeekendColor()}`}
            >
              <span className={`text-sm ${!isWeekendToday ? 'invisible' : 'text-white'}`}>{problem.title}</span>
              <div className={`flex items-center gap-2 ${!isWeekendToday ? 'invisible' : ''}`}>
                <Badge
                  className={
                    problem.difficulty === "Easy"
                      ? "bg-green-500/20 text-green-400"
                      : problem.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }
                >
                  {problem.difficulty}
                </Badge>
                <a
                  href={`https://leetcode.com/problems/${titleToSlug(problem.title)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer">
                    Link
                  </Badge>
                </a>
                <button
                  onClick={() => handleVerify(problem.id, problem.title)}
                  disabled={(!onVerify || problem.solved) ?? !isWeekendToday}
                  className="cursor-pointer disabled:cursor-not-allowed"
                >
                  <Badge className={problem.solved ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"}>
                    {problem.solved ? 'Verified' : 'Verify'}
                  </Badge>
                </button>
                {problem.solved && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            </div>
          ))}
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
    </Card>
  );
}
