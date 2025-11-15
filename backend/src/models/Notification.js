import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['announcement', 'tournament', 'reward', 'system', 'warning'],
    default: 'announcement'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'players', 'specific'],
    default: 'all'
  },
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  relatedTournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  // NEW: Optional link field
  link: {
    type: String,
    default: null,
    trim: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledFor: Date,
  sentAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ targetAudience: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

