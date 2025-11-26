import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-gray-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16 text-white">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <h1 className="text-7xl font-extrabold tracking-tight sm:text-8xl bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
                FluxCode
              </h1>
            </div>
            <p className="text-3xl font-semibold text-white/90">
              Long-term Coding Contest Platform
            </p>
            <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Join competitive coding contests, track your progress, compete on leaderboards,
              and master data structures & algorithms with AI-powered suggestions.
            </p>
          </div>

          <div className="flex gap-6 mt-8">
            <Link href="/auth/signin">
              <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/50 transition-all duration-200 hover:scale-105">
                Get Started
              </button>
            </Link>
            <Link href="/contests">
              <button className="px-8 py-4 text-lg font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105">
                Browse Contests
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl w-full">
            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Compete & Learn</h3>
              <p className="text-white/70 text-lg leading-relaxed">
                Join long-term contests with dynamic topics and daily AI-generated suggestions
              </p>
            </div>
            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-3 text-white">Track Progress</h3>
              <p className="text-white/70 text-lg leading-relaxed">
                Real-time leaderboards, streaks, and detailed analytics of your journey
              </p>
            </div>
            <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-3 text-white">AI Powered</h3>
              <p className="text-white/70 text-lg leading-relaxed">
                Get personalized learning paths and motivational coaching from AI
              </p>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
