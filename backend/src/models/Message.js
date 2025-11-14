import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  senderRole: {
    type: String,
    enum: ['admin', 'player'],
    required: true
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ tournamentId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
