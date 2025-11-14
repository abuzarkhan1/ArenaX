export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin';
  lastLogin?: string;
}

export interface User {
  role: string;
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  userType: 'player';
  coinBalance: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  accountStatus: 'active' | 'suspended' | 'banned';
  profileImage: string;
  gameStats: {
    totalTournamentsJoined: number;
    totalTournamentsCreated: number;
    totalWins: number;
    totalKills: number;
  };
  createdAt: string;
}

// Streaming Configuration Interface
export interface StreamingConfig {
  enabled: boolean;
  platform: 'YouTube' | 'Twitch' | 'Facebook' | 'Custom' | 'None';
  streamUrl: string;
  streamTitle?: string;
  streamStatus: 'not_started' | 'live' | 'ended' | 'cancelled';
}

export interface Tournament {
  rules: string;
  bannerImage: string;
  _id: string;
  title: string;
  description: string;
  gameType: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  prizeDistribution: PrizeDistribution[];
  status: 'pending' | 'approved' | 'live' | 'completed' | 'cancelled' | 'rejected';
  scheduledDate: string;
  rejectionReason?: string;
  createdAt: string;
  streaming?: StreamingConfig;
}

export interface Participant {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  username: string;
  kills: number;
  finalRank: number;
  screenshot?: string;
  coinsWon: number;
  status: 'pending' | 'verified' | 'rejected';
}

export interface PrizeDistribution {
  rank: number;
  coins: number;
  percentage: number;
}

export interface Transaction {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  transactionType: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: 'purchase' | 'tournament_entry' | 'tournament_win' | 'refund' | 'admin_adjustment' | 'bonus';
  description: string;
  relatedTournament?: {
    _id: string;
    title: string;
  };
  paymentMethod: string;
  paymentReference?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'announcement' | 'tournament' | 'reward' | 'system' | 'warning';
  targetAudience: 'all' | 'players' | 'organizers' | 'specific';
  specificUsers?: string[];
  relatedTournament?: string;
  isScheduled: boolean;
  scheduledFor?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

export interface Settings {
  _id: string;
  settingKey: string;
  settingValue: any;
  description?: string;
  category: 'economy' | 'platform' | 'payment' | 'general';
  lastModifiedBy?: {
    _id: string;
    username: string;
  };
  updatedAt: string;
}

export interface Message {
  _id: string;
  tournamentId: string;
  userId: string;
  username: string;
  message: string;
  senderRole: 'admin' | 'player';
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalTournaments: number;
    liveTournaments: number;
    pendingTournaments: number;
    totalCoinsInCirculation: number;
    totalRevenuePKR: number;
  };
  charts: {
    userGrowth: Array<{ _id: string; count: number }>;
    coinPurchasesTrend: Array<{ _id: string; totalCoins: number; count: number }>;
  };
  topCoinHolders: Array<{
    username: string;
    email: string;
    coinBalance: number;
    userType: string;
  }>;
  recentTransactions: Transaction[];
}

export interface Withdrawal {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    phoneNumber: string;
    coinBalance: number;
  };
  amount: number;
  paymentMethod: 'Easypaisa' | 'JazzCash' | 'Bank Transfer';
  accountNumber: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote: string;
  processedBy?: {
    _id: string;
    username: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}