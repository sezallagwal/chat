import { NextResponse } from "next/server";
import connectDB from "../../../../db.js";
import Sidebar from "../../../../models/Sidebar.model.js";

export async function GET(req: Request) {
  connectDB();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  try {
    const allSidebarUsers = await Sidebar.find({
      $or: [
        { userId: userId }, // Check if userId matches
        { chatUserId: userId }, // Check if chatUserId matches
      ],
    })
      .limit(10)
      .exec();

    console.log("allsidebar users", allSidebarUsers);
    // Map the response to set username dynamically
    const formattedSidebarUsers = allSidebarUsers.map((user) => {
      return {
        _id: user.chatUserId,
        chatUserId: user.chatUserId,
        profileImage: user.chatUserId.equals(userId)
          ? user.myProfileImage
          : user.profileImage,
        username: user.chatUserId.equals(userId)
          ? user.myUsername
          : user.username,
      };
    });

    return NextResponse.json({
      message: "Sidebar users fetched successfully",
      data: {
        allSidebarUsers: formattedSidebarUsers,
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
