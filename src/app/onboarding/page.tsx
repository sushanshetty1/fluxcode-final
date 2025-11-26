"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

import { Suspense } from "react";

function OnboardingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [linkedinUsername, setLinkedinUsername] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  const validateLeetCode = async () => {
    if (!leetcodeUsername) {
      return;
    }
    setIsValidating(true);
    try {
      // Call our backend API instead of LeetCode directly to avoid CORS
      const response = await fetch(`/api/validate-leetcode?username=${encodeURIComponent(leetcodeUsername)}`);
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setIsValid(data.valid);
    } catch {
      setIsValid(false);
    }
    setIsValidating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      userId: userId ?? undefined,
      linkedinUsername,
      leetcodeUsername,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-400">
            We need a few more details to get you started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300">
              LinkedIn Username *
            </label>
            <input
              id="linkedin"
              type="text"
              required
              value={linkedinUsername}
              onChange={(e) => setLinkedinUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="leetcode" className="block text-sm font-medium text-gray-300">
              LeetCode Username *
            </label>
            <div className="flex gap-2">
              <input
                id="leetcode"
                type="text"
                required
                value={leetcodeUsername}
                onChange={(e) => {
                  setLeetcodeUsername(e.target.value);
                  setIsValid(false);
                }}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-700 text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="johndoe"
              />
              <Button
                type="button"
                onClick={validateLeetCode}
                disabled={isValidating || !leetcodeUsername}
                className="mt-1 bg-gray-600 hover:bg-gray-700"
              >
                {isValidating ? "..." : "Verify"}
              </Button>
            </div>
            {isValid && <p className="mt-1 text-sm text-green-500">✓ Valid LeetCode username</p>}
            {leetcodeUsername && !isValidating && !isValid && leetcodeUsername.length > 0 && (
              <p className="mt-1 text-sm text-red-500">Click Verify to check username</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Required for problem verification
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={updateProfile.isPending || !isValid || !linkedinUsername || !leetcodeUsername}
          >
            {updateProfile.isPending ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );

}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
