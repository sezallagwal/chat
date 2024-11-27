import mongoose from "mongoose";


const MessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Sidebar", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
