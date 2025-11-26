import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (!session.user.onboardingCompleted) {
    redirect(`/onboarding?userId=${session.user.id}`);
  }

  const contest = await api.contest.getUserContest();

  // If user is in a contest, redirect to the contest page
  if (contest) {
    redirect(`/contest/${contest.id}`);
  }

  // If not in a contest, redirect to contests listing
  redirect("/contests");
}

