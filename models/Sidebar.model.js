import mongoose from "mongoose";

const SidebarSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  lastMessage: {
    content: { type: String, default: "" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  unreadCount: {
    type: Map,
    of: Number, // Maps userId to unread message count
  },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  updatedAt: { type: Date, default: Date.now },
});

// Create Indexes
SidebarSchema.index({ "participants.userId": 1 }); // Optimize for finding user's chats
SidebarSchema.index({ "lastMessage.timestamp": -1 }); // Optimize for sorting by last message
SidebarSchema.index({ updatedAt: -1 }); // Optimize for recent updates

SidebarSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Sidebar =
  mongoose.models.Sidebar || mongoose.model("Sidebar", SidebarSchema);

export default Sidebar;
