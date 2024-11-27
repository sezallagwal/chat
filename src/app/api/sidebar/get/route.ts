import { NextResponse } from "next/server";
import connectDB from "../../../../../db.js";
import Sidebar from "../../../../../models/Sidebar.model.js";

export async function GET(req: Request) {
  connectDB();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  try {
    const allSidebarUsers = await Sidebar.find({
      participants: userId, // Fetch chats where the user is a participant
    })
      .populate({
        path: "participants",
        select: "username profileImage",
      })
      .populate({
        path: "lastMessage.sender",
        select: "username",
      })
      .sort({ "lastMessage.timestamp": -1 }); // Sort by the most recent message

    return NextResponse.json({allSidebarUsers});
  } catch (error) {
    console.error("Error handling sidebar request:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar users" },
      { status: 500 }
    );
  }
}
