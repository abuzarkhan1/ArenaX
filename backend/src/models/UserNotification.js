import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
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
  link: {
    type: String,
    default: null
  },
  relatedTournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
userNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, createdAt: -1 });

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);

export default UserNotification;