import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 50 
  },
  paymentMethod: {
    type: String,
    enum: ['Easypaisa', 'JazzCash', 'Bank Account'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  screenshot: {
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

depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ status: 1 });

const Deposit = mongoose.model('Deposit', depositSchema);

export default Deposit;