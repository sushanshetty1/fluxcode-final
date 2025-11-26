import { api } from "~/trpc/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";

export default async function Contests() {
  const contests = await api.contest.getAll();
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="border-b border-gray-800 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-indigo-400">FluxCode</h1>
            </Link>
            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Active Contests</h2>
          {session && (
            <Link href="/contests/create">
              <Button>Create Contest</Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <div key={contest.id} className="rounded-lg bg-gray-800 p-6 shadow hover:shadow-lg transition-shadow">
              <h3 className="mb-2 text-xl font-bold text-white">{contest.name}</h3>
              <p className="mb-4 text-sm text-gray-400">
                {contest.description ?? "No description"}
              </p>
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                <span>By {contest.creator.name}</span>
                <span>•</span>
                <span>{contest._count.participants} participants</span>
              </div>
              <Link href={`/contest/${contest.id}`}>
                <Button className="w-full">View Contest</Button>
              </Link>
            </div>
          ))}

          {contests.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No active contests found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
