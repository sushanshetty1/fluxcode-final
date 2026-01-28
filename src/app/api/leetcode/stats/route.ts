import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
            ranking
            reputation
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          badges {
            id
            displayName
            icon
          }
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `;

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch LeetCode data");
    }

    const data = await response.json();

    if (!data.data?.matchedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data.data.matchedUser);
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch LeetCode stats" },
      { status: 500 }
    );
  }
}
