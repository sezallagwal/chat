import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  // senderId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  // receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  // messageType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  // status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  // attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update the updatedAt field before saving
MessageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model is already defined to avoid OverwriteModelError
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;
