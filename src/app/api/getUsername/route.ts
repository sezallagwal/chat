import connectDB from "../../../../db.js";
import User from "../../../../models/User.model.js";

import { NextResponse } from "next/server.js";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const username = url.searchParams.get("userId");

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { message: "Invalid username query" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const users = await User.find({
      username: { $regex: new RegExp(username, "i") },
    }) // Case-insensitive search
      .limit(10)
      .exec();
    if (!users) {
      return NextResponse.json({ message: "No users found" }, { status: 404 });
    }

    return NextResponse.json(users, {status:200});
  } catch (error) {
    console.error("Error saving user:", error);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}
