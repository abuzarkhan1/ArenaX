import User from '../models/User.js';
import logger from '../config/logger.js';
import Transaction from '../models/Transaction.js';
import Tournament from '../models/Tournament.js';

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, accountStatus, page = 1, limit = 20 } = req.query;

    const query = { role: 'player' };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (accountStatus) query.accountStatus = accountStatus;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
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

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('processedBy', 'username');

    const tournaments = await Tournament.find({
      'participants.userId': user._id
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      user,
      recentTransactions: transactions,
      recentTournaments: tournaments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.accountStatus = accountStatus;
    await user.save();

    res.json({
      success: true,
      message: `User account ${accountStatus}`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustUserCoins = async (req, res) => {
  try {
    const { amount, type, description, paymentMethod, paymentReference } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot adjust admin coins. Admins have unlimited coins.' });
    }

    const balanceBefore = user.coinBalance;
    let balanceAfter;

    if (type === 'credit') {
      balanceAfter = balanceBefore + amount;
      user.coinBalance += amount;
      user.totalCoinsEarned += amount;
    } else {
      if (user.coinBalance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      balanceAfter = balanceBefore - amount;
      user.coinBalance -= amount;
      user.totalCoinsSpent += amount;
    }

    await user.save();

    const transaction = await Transaction.create({
      userId: user._id,
      transactionType: type,
      amount,
      balanceBefore,
      balanceAfter,
      category: 'admin_adjustment',
      description,
      paymentMethod: paymentMethod || 'Admin',
      paymentReference,
      processedBy: req.user._id,
      status: 'completed'
    });

    res.json({
      success: true,
      message: `${amount} coins ${type === 'credit' ? 'added to' : 'deducted from'} user account`,
      user,
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'player' });
    const activePlayers = await User.countDocuments({ role: 'player', accountStatus: 'active' });
    const totalCoinsInCirculation = await User.aggregate([
      { $match: { role: 'player' } },
      { $group: { _id: null, total: { $sum: '$coinBalance' } } }
    ]);

    const topCoinHolders = await User.find({ role: 'player' })
      .select('username email coinBalance role')
      .sort({ coinBalance: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activePlayers,
        totalCoinsInCirculation: totalCoinsInCirculation[0]?.total || 0,
        topCoinHolders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
