// app/api/db/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../db.js";
import Sidebar from "../../../../models/Sidebar.model.js";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const chatUserId = url.searchParams.get("chatUserId");
    const username = url.searchParams.get("username");
    const profileImage = url.searchParams.get("profileImage");
    console.log(username);

    let sidebar = await Sidebar.findOne({
      userId: userId,
      chatUserId: chatUserId,
    });

    if (!sidebar) {

      sidebar = await Sidebar.create({
        userId,
        chatUserId,
        username,
        profileImage,
      });
      return NextResponse.json({
        message: "New sidebar created successfully",
        data: {
          sidebarId: sidebar._id,
          userId,
          username,
          profileImage,
        },
      });
    } else {

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
    }
  } catch (error) {
    console.error("Error handling sidebar request:", error);
    return NextResponse.json(
      { error: "Failed to handle sidebar request" },
      { status: 500 }
    );
  }
}
