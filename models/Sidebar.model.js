import mongoose from "mongoose";

const SidebarSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    chatUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String},
    myUsername: { type: String},
    profileImage: { type: String },
    myProfileImage: { type: String },
    updatedAt: { type: Date, default: Date.now },
})


SidebarSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Sidebar = mongoose.models.Sidebar || mongoose.model('Sidebar', SidebarSchema);

export default Sidebar;