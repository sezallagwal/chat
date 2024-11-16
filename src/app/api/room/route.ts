// app/api/db/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../db.js";
import Room from "../../../../models/Room.model.js";
import Message from "../../../../models/Message.model.js";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);

    const userId = url.searchParams.get("userId");
    const chatUserId = url.searchParams.get("chatUserId");
    const username = url.searchParams.get("username");
    const profileImage = url.searchParams.get("profileImage");
    console.log(username);
    // Check if a room with these participants already exists
    let room = await Room.findOne({
      participants: { $all: [userId, chatUserId] },
    });

    if (!room) {
      // Create a new room if none exists
      room = await Room.create({ participants: [userId, chatUserId] });
      return NextResponse.json({
        message: "New room created successfully",
        data: {
          roomId: room._id,
          participants: room.participants,
          username,
          profileImage,
          messages: [], 
        },
      });
    } else {

      const messages = await Message.find({ roomId: room._id }).sort({ createdAt: 1 });

      return NextResponse.json({
        message: "Room found successfully",
        data: {
          roomId: room._id,
          participants: room.participants,
          username,
          profileImage,
          messages,
        },
      });
    }
  } catch (error) {
    console.error("Error handling room request:", error);
    return NextResponse.json(
      { error: "Failed to handle room request" },
      { status: 500 }
    );
  }
}
