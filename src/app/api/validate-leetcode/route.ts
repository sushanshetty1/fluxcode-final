import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ valid: false, error: "Username required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        query: `query { matchedUser(username: "${username}") { username } }`,
      }),
    });

    const data = await response.json();
    const isValid = !!data.data?.matchedUser?.username;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("LeetCode validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
