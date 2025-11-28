import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transaction_type: { 
    type: String, 
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'], 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  // Optional: For Transfers
  recipientPhone: { type: String },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

export default Transaction;