import User from '../models/User.js';
import logger from '../config/logger.js';
import Tournament from '../models/Tournament.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ accountStatus: 'active' });

    // Get tournament stats
    const totalTournaments = await Tournament.countDocuments();
    const liveTournaments = await Tournament.countDocuments({ status: 'live' });
    const pendingTournaments = await Tournament.countDocuments({ status: 'pending' });

    // Get coin stats
    const totalCoinsInCirculation = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$coinBalance' } } }
    ]);

    // Get total revenue (only completed/approved transactions)
    const totalCoinsDistributed = await Transaction.aggregate([
      { 
        $match: { 
          transactionType: 'credit',
          status: { $in: ['completed', 'approved'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get total transactions count
    const totalTransactions = await Transaction.countDocuments();

    // Get top coin holders
    const topCoinHolders = await User.find()
      .select('username email coinBalance userType')
      .sort({ coinBalance: -1 })
      .limit(5);

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(10);

    // User growth in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    // Coin purchases trend (last 30 days)
    const coinPurchasesTrend = await Transaction.aggregate([
      {
        $match: {
          category: 'deposit',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCoins: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // Calculate total revenue in PKR (assuming 1 coin = 1 PKR for deposits)
    const totalRevenuePKR = totalCoinsDistributed[0]?.total || 0;

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          activeUsers,
          totalTournaments,
          liveTournaments,
          pendingTournaments,
          totalCoinsInCirculation: totalCoinsInCirculation[0]?.total || 0,
          totalRevenuePKR,
          totalTransactions
        },
        topCoinHolders,
        recentTransactions,
        charts: {
          userGrowth,
          coinPurchasesTrend
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
