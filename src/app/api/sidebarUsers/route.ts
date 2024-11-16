import { NextResponse } from "next/server";
import connectDB from "../../../../db.js";
import Sidebar from "../../../../models/Sidebar.model.js";

export async function GET(req: Request) {
  connectDB();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  try {
    const allSidebarUsers = await Sidebar.find({
      userId: userId,
    })
      .limit(10)
      .exec();

    return NextResponse.json({
      message: "sidebar found successfully",
      data: {
        allSidebarUsers,
      },
    });
  } catch (error) {
    console.error("Error handling sidebar request:", error);
    return NextResponse.json(
      { error: "Failed to handle sidebar request" },
      { status: 500 }
    );
  }
}
