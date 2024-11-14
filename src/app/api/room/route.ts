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
          messages: [], // Empty messages for a new room
        },
      });
    } else {
      // If the room exists, fetch all messages associated with this room
      const messages = await Message.find({ roomId: room._id }).sort({ createdAt: 1 }); // Sort by creation time if needed

      return NextResponse.json({
        message: "Room found successfully",
        data: {
          roomId: room._id,
          participants: room.participants,
          messages, // Include messages in the response
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
