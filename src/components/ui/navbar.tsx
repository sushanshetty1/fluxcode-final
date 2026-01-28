"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { Code2, Trophy, LayoutDashboard, LogOut, User } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { api } from "~/trpc/react";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [, setLoading] = useState(true);
  const { data: userProfile } = api.user.getProfile.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    void supabase.auth.getUser().then(({ data: { user } }: { data: { user: SupabaseUser | null } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const baseNavItems = [
    { href: "/contests", label: "Contests", icon: Trophy },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const navItems = baseNavItems.filter(item => !item.adminOnly || userProfile?.isAdmin);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              FluxCode
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
                
                <button
                  onClick={handleSignOut}
                  className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
