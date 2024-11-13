import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  clerkId: { type: String, required: true, unique: true },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update the updatedAt field before saving
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model is already defined to avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;