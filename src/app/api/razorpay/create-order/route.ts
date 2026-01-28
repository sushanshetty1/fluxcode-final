import { NextResponse } from "next/server";
import { getUser } from "~/lib/supabase/server";
import { db } from "~/server/db";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contestId, weekNumber } = await request.json();

    const contest = await db.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const amount = contest.penaltyAmount * 100; // Convert to paise

    // Initialize Razorpay inside the function
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Generate receipt - max 40 characters
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `${timestamp}_${weekNumber ?? "entry"}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
    });

    // Create payment record
    const payment = await db.payment.create({
      data: {
        contestId,
        userId: user.id,
        razorpayOrderId: order.id,
        amount: contest.penaltyAmount,
        currency: "INR",
        status: "pending",
        weekNumber: weekNumber ?? null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: contest.penaltyAmount,
      currency: "INR",
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
