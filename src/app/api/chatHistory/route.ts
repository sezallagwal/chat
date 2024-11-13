// app/api/db/chatHistory/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../db";
import Message from "../../../../models/Message.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { clerkId } = await req.json();
    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    // Retrieve the user's previous messages
    const chatHistory = await Message.find({
      $or: [{ senderId: clerkId }, { receiverId: clerkId }],
    }).populate("senderId receiverId");

    return NextResponse.json({ chatHistory });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
