import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import Transaction from '../models/Transaction.js';
import Settings from '../models/Settings.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'player' });
    const activeUsers = await User.countDocuments({ role: 'player', accountStatus: 'active' });
    const totalTournaments = await Tournament.countDocuments();
    const liveTournaments = await Tournament.countDocuments({ status: 'live' });
    const pendingTournaments = await Tournament.countDocuments({ status: 'pending' });

    const totalCoinsInCirculation = await User.aggregate([
      { $match: { role: 'player' } },
      { $group: { _id: null, total: { $sum: '$coinBalance' } } }
    ]);

    const totalCoinsDistributed = await Transaction.aggregate([
      { $match: { transactionType: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const conversionRateSetting = await Settings.findOne({ settingKey: 'coin_conversion_rate' });
    const conversionRate = conversionRateSetting ? conversionRateSetting.settingValue : 1;

    const totalRevenuePKR = (totalCoinsDistributed[0]?.total || 0) * conversionRate;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const userGrowth = await User.aggregate([
      { $match: { role: 'player', createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const coinPurchasesTrend = await Transaction.aggregate([
      {
        $match: {
          category: { $in: ['purchase', 'admin_adjustment'] },
          transactionType: 'credit',
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCoins: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topCoinHolders = await User.find({ role: 'player' })
      .select('username email coinBalance role')
      .sort({ coinBalance: -1 })
      .limit(5);

    const recentTransactions = await Transaction.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

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
          totalRevenuePKR
        },
        charts: {
          userGrowth,
          coinPurchasesTrend
        },
        topCoinHolders,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
