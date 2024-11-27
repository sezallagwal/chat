import connectDB from "../../../../../db";
import Message from "../../../../../models/Message.model";
import Sidebar from "../../../../../models/Sidebar.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json(
        { message: "Method not allowed" },
        { status: 405 }
      );
  }

  const { room, sender, content } = await req.json();

  if (!room || !sender || !content) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    await connectDB();

    // Create and save the message
    const newMessage = await Message.create({
      room,
      sender,
      content,
      timestamp: new Date(),
    });

    // Update the lastMessage field in the associated sidebar
    const updatedSidebar = await Sidebar.findByIdAndUpdate(
      room,
      {
        lastMessage: {
          content: content,
          sender: sender,
          timestamp: new Date(),
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedSidebar) {
      return NextResponse.json({ error: "Sidebar not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: newMessage,
      sidebar: updatedSidebar,
      status: 201,
    });
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json(
      { message: "Internal Server error" },
      { status: 500 }
    );
  }
}
