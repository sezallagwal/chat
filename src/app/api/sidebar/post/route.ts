import { NextResponse } from "next/server";
import connectDB from "../../../../../db.js";
import Sidebar from "../../../../../models/Sidebar.model.js";

connectDB();

export async function POST(req: Request) {
  try {
    const { participants } = await req.json();

    if (!participants || participants.length !== 2) {
      return NextResponse.json(
        { error: "Invalid participants array" },
        { status: 400 }
      );
    }

    const existingSidebar = await Sidebar.findOne({
      participants: { $all: participants },
    });

    if (existingSidebar) {
      return NextResponse.json({
        message: "Sidebar entry already exists",
        data: existingSidebar,
      });
    }

    const newSidebar = new Sidebar({
      participants,
      lastMessage: null,
      unreadCount: participants.reduce((acc: Record<string, number>, userId: string) => {
        acc[userId] = 0;
        return acc;
      }, {}),
    });

    await newSidebar.save();

    return NextResponse.json({newSidebar});
  } catch (error) {
    console.error("Error creating sidebar entry:", error);
    return NextResponse.json(
      { error: "Failed to create sidebar entry" },
      { status: 500 }
    );
  }
}
