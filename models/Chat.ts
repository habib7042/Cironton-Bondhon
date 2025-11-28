import mongoose, { Schema, model, models } from 'mongoose';

const ChatSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  memberId: { type: String, required: true }, // Short ID like MEM-1234
  userImage: { type: String }, // Profile image URL
  message: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Chat = models.Chat || model('Chat', ChatSchema);

export default Chat;