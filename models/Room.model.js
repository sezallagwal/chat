import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

// Middleware to update the updatedAt field before saving
RoomSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

export default Room;