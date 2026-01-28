import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, api routes, and auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/public") ||
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/refund" ||
    pathname === "/contact"
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const response = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated, redirect to signin
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  // If on onboarding page, allow access (authenticated users can access onboarding)
  if (pathname === "/onboarding") {
    // Check if they've already completed onboarding and redirect to contests if so
    try {
      const dbCheckResponse = await fetch(`${request.nextUrl.origin}/api/trpc/user.getProfile?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22userId%22%3A%22${user.id}%22%7D%7D%7D`, {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      });

      if (dbCheckResponse.ok) {
        const data = await dbCheckResponse.json() as Array<{ result: { data?: { json?: { leetcodeUsername?: string; onboardingCompleted?: boolean } } } }>;
        const userProfile = data[0]?.result?.data?.json;
        const hasCompletedOnboarding = userProfile?.onboardingCompleted && userProfile?.leetcodeUsername;

        if (hasCompletedOnboarding) {
          const url = request.nextUrl.clone();
          url.pathname = "/contests";
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error("Middleware onboarding check error:", error);
    }
    return response;
  }

  // For all other protected pages, check if they have completed onboarding
  try {
    const dbCheckResponse = await fetch(`${request.nextUrl.origin}/api/trpc/user.getProfile?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22userId%22%3A%22${user.id}%22%7D%7D%7D`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (dbCheckResponse.ok) {
      const data = await dbCheckResponse.json() as Array<{ result: { data?: { json?: { leetcodeUsername?: string; onboardingCompleted?: boolean } } } }>;
      const userProfile = data[0]?.result?.data?.json;
      const hasCompletedOnboarding = userProfile?.onboardingCompleted && userProfile?.leetcodeUsername;

      if (!hasCompletedOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    } else {
      // If profile doesn't exist, redirect to onboarding
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware profile check error:", error);
    // If profile check fails, redirect to onboarding
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
