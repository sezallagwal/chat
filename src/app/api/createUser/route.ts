// app/api/db/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../db.js";
import User from "../../../../models/User.model.js";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // Parse the JSON body from the request
    const userDetails = await req.json();
    // Now you can access the data from the body, like userDetails.name, userDetails.email, etc.
    // Check if a user with the same `clerkId` already exists
    let user = await User.findOne({ clerkId: userDetails.clerkId });

    if (user) {
      // If user exists, update the details
      user.username = userDetails.username;
      user.email = userDetails.email;
      user.profileImage = userDetails.profileImage || user.profileImage;
      await user.save();
    } else {
      // If user does not exist, create a new user
      user = await User.create(userDetails);
    }

    // Example response:
    return NextResponse.json({
      message: "User saved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error saving user:", error);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}
