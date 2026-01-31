import { NextResponse } from "next/server";
import { notifyWeekendContestStart, notifyWeekendReminder } from "~/server/cron/weekend-notifications";

/**
 * API route for weekend notifications cron jobs
 * 
 * Schedule these endpoints using a cron service:
 * - Saturday 00:00 IST: /api/cron/weekend-notifications?type=start
 * - Sunday 18:00 IST: /api/cron/weekend-notifications?type=reminder
 * 
 * You can use services like:
 * - Vercel Cron (vercel.json)
 * - GitHub Actions
 * - Cron-job.org
 * - EasyCron
 */

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Security: Check for authorization header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error("CRON_SECRET not configured in environment variables");
      return NextResponse.json(
        { 
          success: false,
          error: "Server configuration error",
          details: "CRON_SECRET not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    
    if (!authHeader) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          details: "Missing Authorization header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          details: "Invalid authorization token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { 
          success: false,
          error: "Bad Request",
          details: "Missing required parameter 'type'",
          validTypes: ["start", "reminder"],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (type === "start") {
      console.log(`[CRON] Starting weekend contest notifications at ${new Date().toISOString()}`);
      await notifyWeekendContestStart();
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: "Weekend contest start notifications sent successfully",
        type: "start",
        executionTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    } else if (type === "reminder") {
      console.log(`[CRON] Starting weekend reminder notifications at ${new Date().toISOString()}`);
      await notifyWeekendReminder();
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: "Weekend reminder notifications sent successfully",
        type: "reminder",
        executionTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: "Bad Request",
          details: `Invalid type '${type}'`,
          validTypes: ["start", "reminder"],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[CRON] Error executing weekend notifications:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        executionTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
