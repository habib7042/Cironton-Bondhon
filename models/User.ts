import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  balance: { type: Number, default: 0.00 },
  isAdmin: { type: Boolean, default: false },
  profileImage: { type: String, default: '' },
  
  // Extended Details
  fatherName: { type: String },
  motherName: { type: String },
  nid: { type: String },
  dob: { type: String },
  email: { type: String },
  address: { type: String },
  nomineeName: { type: String },
  nomineeNid: { type: String },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Prevent model recompilation error in Next.js hot reload
const User = models.User || model('User', UserSchema);

export default User;