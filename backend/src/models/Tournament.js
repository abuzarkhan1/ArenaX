import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  kills: { type: Number, default: 0 },
  finalRank: { type: Number, default: 0 },
  screenshot: String,
  coinsWon: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
});

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['Free Fire', 'PUBG Mobile', 'Call of Duty Mobile', 'Other']
  },
  category: {
    type: String,
    required: true,
    enum: ['Free Fire', 'PUBG']
  },
  subCategory: {
    type: String,
    enum: ['Bermuda', 'Clash Squad', null],
    default: null
  },
  mode: {
    type: String,
    enum: ['1v1', '4v4', null],
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0
  },
  prizePool: {
    type: Number,
    required: true,
    min: 0
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [participantSchema],
  prizeDistribution: [{
    rank: Number,
    coins: Number,
    percentage: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'live', 'completed', 'cancelled', 'rejected'],
    default: 'approved'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  roomDetails: {
    roomId: String,
    roomPassword: String
  },
  rules: {
    type: String,
    default: ''
  },
  bannerImage: String,
  
  // Live Streaming Fields
  streaming: {
    enabled: {
      type: Boolean,
      default: false
    },
    platform: {
      type: String,
      enum: ['YouTube', 'Twitch', 'Facebook', 'Custom', 'None'],
      default: 'None'
    },
    streamUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          // Basic URL validation
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid stream URL format'
      }
    },
    streamTitle: {
      type: String,
      trim: true
    },
    streamStatus: {
      type: String,
      enum: ['not_started', 'live', 'ended', 'cancelled'],
      default: 'not_started'
    }
  },
  
  rejectionReason: String,
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminApprovedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
tournamentSchema.index({ status: 1, scheduledDate: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ 'streaming.enabled': 1, 'streaming.streamStatus': 1 });

// Virtual for checking if stream is active
tournamentSchema.virtual('isStreamActive').get(function() {
  return this.streaming?.enabled && this.streaming?.streamStatus === 'live';
});

// Method to start stream
tournamentSchema.methods.startStream = function() {
  if (this.streaming.enabled && this.streaming.streamUrl) {
    this.streaming.streamStatus = 'live';
    return this.save();
  }
  throw new Error('Streaming is not enabled or URL is missing');
};

// Method to end stream
tournamentSchema.methods.endStream = function() {
  if (this.streaming.enabled) {
    this.streaming.streamStatus = 'ended';
    return this.save();
  }
  throw new Error('Streaming is not enabled');
};

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;