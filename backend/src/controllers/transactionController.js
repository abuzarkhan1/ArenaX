import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export const getAllTransactions = async (req, res) => {
  try {
    const { userId, category, transactionType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (category) query.category = category;
    if (transactionType) query.transactionType = transactionType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email')
      .populate('processedBy', 'username')
      .populate('relatedTournament', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (period === 'day') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
    } else if (period === 'year') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1)
        }
      };
    }

    const totalCredited = await Transaction.aggregate([
      { $match: { ...dateFilter, transactionType: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDebited = await Transaction.aggregate([
      { $match: { ...dateFilter, transactionType: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const categoryBreakdown = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const dailyTransactions = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          credited: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0] }
          },
          debited: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalCredited: totalCredited[0]?.total || 0,
        totalDebited: totalDebited[0]?.total || 0,
        netFlow: (totalCredited[0]?.total || 0) - (totalDebited[0]?.total || 0),
        categoryBreakdown,
        dailyTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWalletOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalCoinsDistributed = await Transaction.aggregate([
      { $match: { transactionType: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCoinsSpent = await Transaction.aggregate([
      { $match: { transactionType: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCoinsInCirculation = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$coinBalance' } } }
    ]);

    const topSpenders = await User.find()
      .select('username email totalCoinsSpent')
      .sort({ totalCoinsSpent: -1 })
      .limit(10);

    const topEarners = await User.find()
      .select('username email totalCoinsEarned')
      .sort({ totalCoinsEarned: -1 })
      .limit(10);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalCoinsDistributed: totalCoinsDistributed[0]?.total || 0,
        totalCoinsSpent: totalCoinsSpent[0]?.total || 0,
        totalCoinsInCirculation: totalCoinsInCirculation[0]?.total || 0,
        topSpenders,
        topEarners
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get current user's transactions with pagination
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5 } = req.query;
    
    const skip = (page - 1) * limit;
    
    console.log(`Fetching transactions for user: ${userId}, Page: ${page}`);
    
    const transactions = await Transaction.find({ userId: userId })
      .populate('relatedTournament', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({ userId: userId });

    console.log(`Found ${transactions.length} transactions (Total: ${total})`);

    res.json({
      success: true,
      transactions,
      count: transactions.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};