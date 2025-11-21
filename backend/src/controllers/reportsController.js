import User from '../models/User.js';
import logger from '../config/logger.js';
import Tournament from '../models/Tournament.js';
import Transaction from '../models/Transaction.js';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
import Settings from '../models/Settings.js';

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { startDate, endDate: now };
};

export const getComprehensiveReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // 1. USER ANALYTICS
    const totalUsers = await User.countDocuments({ role: 'player' });
    const activeUsers = await User.countDocuments({ role: 'player', accountStatus: 'active' });
    const suspendedUsers = await User.countDocuments({ role: 'player', accountStatus: 'suspended' });
    const bannedUsers = await User.countDocuments({ role: 'player', accountStatus: 'banned' });

    const userGrowth = await User.aggregate([
      { 
        $match: { 
          role: 'player', 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topUsersByCoins = await User.find({ role: 'player' })
      .select('username coinBalance totalCoinsEarned totalCoinsSpent')
      .sort({ coinBalance: -1 })
      .limit(10);

    const usersWithTournaments = await User.countDocuments({ 
      role: 'player', 
      'gameStats.totalTournamentsJoined': { $gt: 0 } 
    });
    const engagementRate = totalUsers > 0 ? ((usersWithTournaments / totalUsers) * 100).toFixed(2) : 0;

    // 2. TOURNAMENT PERFORMANCE
    const tournamentsByStatus = await Tournament.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrizePool: { $sum: '$prizePool' },
          totalEntryFees: { $sum: '$entryFee' }
        }
      }
    ]);

    const totalTournaments = await Tournament.countDocuments();
    const completedTournaments = await Tournament.countDocuments({ status: 'completed' });
    const completionRate = totalTournaments > 0 ? ((completedTournaments / totalTournaments) * 100).toFixed(2) : 0;

    const avgParticipants = await Tournament.aggregate([
      {
        $group: {
          _id: null,
          avgParticipants: { $avg: '$currentParticipants' }
        }
      }
    ]);

    const tournamentsByGameType = await Tournament.aggregate([
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
          totalPrizePool: { $sum: '$prizePool' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const tournamentTrend = await Tournament.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. FINANCIAL OVERVIEW
    const conversionRateSetting = await Settings.findOne({ settingKey: 'coin_conversion_rate' });
    const conversionRate = conversionRateSetting ? conversionRateSetting.settingValue : 1;

    // Revenue from approved/completed deposits
    const depositRevenue = await Deposit.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Payouts from approved/completed withdrawals
    const withdrawalPayouts = await Withdrawal.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = (depositRevenue[0]?.total || 0) * conversionRate;
    const totalPayouts = (withdrawalPayouts[0]?.total || 0) * conversionRate;
    const netProfit = totalRevenue - totalPayouts;

    // Transaction trends
    const transactionTrend = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$transactionType'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Category-wise breakdown
    const transactionsByCategory = await Transaction.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'approved'] }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 4. DEPOSIT & WITHDRAWAL ANALYTICS
    const depositsByStatus = await Deposit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const withdrawalsByStatus = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const depositsByPaymentMethod = await Deposit.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const withdrawalsByPaymentMethod = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Average processing time for deposits
    const avgDepositProcessingTime = await Deposit.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
          processedAt: { $exists: true }
        }
      },
      {
        $project: {
          processingTime: {
            $subtract: ['$processedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // Average processing time for withdrawals
    const avgWithdrawalProcessingTime = await Withdrawal.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
          processedAt: { $exists: true }
        }
      },
      {
        $project: {
          processingTime: {
            $subtract: ['$processedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // 5. REVENUE BREAKDOWN
    const tournamentEntryRevenue = await Transaction.aggregate([
      {
        $match: {
          category: 'tournament_entry',
          status: { $in: ['completed', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const prizesDistributed = await Transaction.aggregate([
      {
        $match: {
          category: 'tournament_win',
          status: { $in: ['completed', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const entryFeeRevenue = (tournamentEntryRevenue[0]?.total || 0) * conversionRate;
    const prizesPaid = (prizesDistributed[0]?.total || 0) * conversionRate;
    const tournamentProfit = entryFeeRevenue - prizesPaid;
    const profitMargin = entryFeeRevenue > 0 ? ((tournamentProfit / entryFeeRevenue) * 100).toFixed(2) : 0;

    // Compile all reports
    const reports = {
      userAnalytics: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        userGrowth,
        topUsersByCoins,
        engagementRate: parseFloat(engagementRate)
      },
      tournamentPerformance: {
        totalTournaments,
        completedTournaments,
        completionRate: parseFloat(completionRate),
        avgParticipants: avgParticipants[0]?.avgParticipants || 0,
        tournamentsByStatus,
        tournamentsByGameType,
        tournamentTrend
      },
      financialOverview: {
        totalRevenue,
        totalPayouts,
        netProfit,
        conversionRate,
        transactionTrend,
        transactionsByCategory
      },
      depositWithdrawalAnalytics: {
        deposits: {
          byStatus: depositsByStatus,
          byPaymentMethod: depositsByPaymentMethod,
          avgProcessingTime: avgDepositProcessingTime[0]?.avgTime || 0
        },
        withdrawals: {
          byStatus: withdrawalsByStatus,
          byPaymentMethod: withdrawalsByPaymentMethod,
          avgProcessingTime: avgWithdrawalProcessingTime[0]?.avgTime || 0
        }
      },
      revenueBreakdown: {
        tournamentEntryRevenue: entryFeeRevenue,
        depositRevenue: totalRevenue,
        prizesDistributed: prizesPaid,
        tournamentProfit,
        profitMargin: parseFloat(profitMargin)
      }
    };

    res.json({
      success: true,
      period,
      reports
    });
  } catch (error) {
    logger.error('Error fetching comprehensive reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export report as CSV
export const exportReport = async (req, res) => {
  try {
    const { type, period = 'month' } = req.query;
    
    // Get the comprehensive reports first
    const { startDate, endDate } = getDateRange(period);
    let csvData = '';
    let filename = '';

    switch (type) {
      case 'users':
        const users = await User.find({ role: 'player' })
          .select('username email coinBalance totalCoinsEarned totalCoinsSpent accountStatus createdAt gameStats')
          .sort({ coinBalance: -1 });
        
        csvData = 'Username,Email,Coin Balance,Total Earned,Total Spent,Status,Tournaments Joined,Total Wins,Created At\n';
        users.forEach(user => {
          csvData += `${user.username},${user.email},${user.coinBalance},${user.totalCoinsEarned},${user.totalCoinsSpent},${user.accountStatus},${user.gameStats?.totalTournamentsJoined || 0},${user.gameStats?.totalWins || 0},${user.createdAt}\n`;
        });
        filename = `users_report_${period}.csv`;
        break;

      case 'tournaments':
        const tournaments = await Tournament.find()
          .select('title gameType status entryFee prizePool currentParticipants maxParticipants scheduledDate createdAt')
          .sort({ createdAt: -1 });
        
        csvData = 'Title,Game Type,Status,Entry Fee,Prize Pool,Participants,Max Participants,Scheduled Date,Created At\n';
        tournaments.forEach(t => {
          csvData += `"${t.title}",${t.gameType},${t.status},${t.entryFee},${t.prizePool},${t.currentParticipants},${t.maxParticipants},${t.scheduledDate},${t.createdAt}\n`;
        });
        filename = `tournaments_report_${period}.csv`;
        break;

      case 'transactions':
        const transactions = await Transaction.find({
          createdAt: { $gte: startDate, $lte: endDate }
        })
          .populate('userId', 'username')
          .select('userId transactionType amount category status createdAt')
          .sort({ createdAt: -1 });
        
        csvData = 'Username,Type,Amount,Category,Status,Date\n';
        transactions.forEach(t => {
          csvData += `${t.userId?.username || 'N/A'},${t.transactionType},${t.amount},${t.category},${t.status},${t.createdAt}\n`;
        });
        filename = `transactions_report_${period}.csv`;
        break;

      case 'deposits':
        const deposits = await Deposit.find()
          .populate('userId', 'username email')
          .select('userId amount paymentMethod status createdAt processedAt')
          .sort({ createdAt: -1 });
        
        csvData = 'Username,Email,Amount,Payment Method,Status,Requested At,Processed At\n';
        deposits.forEach(d => {
          csvData += `${d.userId?.username || 'N/A'},${d.userId?.email || 'N/A'},${d.amount},${d.paymentMethod},${d.status},${d.createdAt},${d.processedAt || 'N/A'}\n`;
        });
        filename = `deposits_report_${period}.csv`;
        break;

      case 'withdrawals':
        const withdrawals = await Withdrawal.find()
          .populate('userId', 'username email')
          .select('userId amount paymentMethod status createdAt processedAt')
          .sort({ createdAt: -1 });
        
        csvData = 'Username,Email,Amount,Payment Method,Status,Requested At,Processed At\n';
        withdrawals.forEach(w => {
          csvData += `${w.userId?.username || 'N/A'},${w.userId?.email || 'N/A'},${w.amount},${w.paymentMethod},${w.status},${w.createdAt},${w.processedAt || 'N/A'}\n`;
        });
        filename = `withdrawals_report_${period}.csv`;
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    logger.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

