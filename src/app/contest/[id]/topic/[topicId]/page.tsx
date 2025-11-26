"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

export default function TopicPage() {
  const params = useParams();
  const contestId = params.id as string;
  const topicId = params.topicId as string;
  const { data: session } = useSession();

  const [verifying, setVerifying] = useState<string | null>(null);

  const { data: problems, refetch } = api.problem.getByTopic.useQuery({ topicId });
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

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/contest/${contestId}`}>
              <h1 className="text-2xl font-bold text-indigo-400">FluxCode</h1>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-white">Problems</h2>

        <div className="space-y-4">
          {problems?.map((problem) => {
            const isCompleted = problem.progress.some((p) => p.completed);
            const isVerifying = verifying === problem.id;
            const isLocked = problem.isLocked;

            return (
              <div key={problem.id} className={`rounded-lg p-6 shadow ${isLocked ? 'bg-gray-800/30 border border-gray-700' : 'bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {isLocked && <span className="text-2xl">🔒</span>}
                      {isCompleted && <span className="text-2xl">✅</span>}
                      {isLocked ? (
                        <span className="text-xl font-semibold text-gray-500">
                          Locked Problem
                        </span>
                      ) : (
                        <a
                          href={problem.hyperlink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xl font-semibold text-indigo-400 hover:underline"
                        >
                          {problem.title}
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {!isLocked && (
                        <>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              problem.difficulty === "Easy"
                                ? "bg-green-900 text-green-300"
                                : problem.difficulty === "Medium"
                                  ? "bg-yellow-900 text-yellow-300"
                                  : "bg-red-900 text-red-300"
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                    {isLocked && (
                      <p className="mt-2 text-sm text-gray-500">
                        This problem will unlock later based on the contest schedule
                      </p>
                    )}
                  </div>
                  <div>
                    {!isCompleted && !isLocked && (
                      <Button
                        onClick={() => handleVerify(problem.id)}
                        disabled={isVerifying}
                      >
                        {isVerifying ? "Verifying..." : "Check"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {(!problems || problems.length === 0) && (
            <div className="py-12 text-center text-gray-400">
              No problems found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
