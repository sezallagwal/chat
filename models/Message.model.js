import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
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
