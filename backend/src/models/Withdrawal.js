import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  paymentMethod: {
    type: String,
    enum: ['Easypaisa', 'JazzCash', 'Bank Transfer'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;