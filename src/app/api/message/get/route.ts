import { NextResponse } from "next/server";
import connectDB from "../../../../../db"
import Message from "../../../../../models/Message.model";


connectDB();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");

  try {
    // Fetch messages associated with the chat room ID
    const messages = await Message.find({ room: chatId })
      .populate("sender", "username profileImage") // Populate sender details
      .sort({ timestamp: 1 }); // Sort messages by timestamp (ascending order)

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        message: "No messages found for this chat",
        data: [],
      });
    }

    return NextResponse.json({messages});
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
