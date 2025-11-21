import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { createAdminNotification } from './adminNotificationController.js';


export const getAllTournaments = async (req, res) => {
  try {
    const { status, gameType, search, page = 1, limit = 20, category, subCategory, mode } = req.query;

    const query = {};
    if (status) query.status = status;
    if (gameType) query.gameType = gameType;
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (mode) query.mode = mode;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const tournaments = await Tournament.find(query)
      .populate('createdBy', 'username email')
      .populate('adminApprovedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tournament.countDocuments(query);

    res.json({
      success: true,
      tournaments,
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

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username email phoneNumber')
      .populate('participants.userId', 'username email')
      .populate('adminApprovedBy', 'username');

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTournamentStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    tournament.status = status;
    if (status === 'approved') {
      tournament.adminApprovedBy = req.user._id;
      tournament.adminApprovedAt = new Date();
    }
    if (status === 'rejected' && rejectionReason) {
      tournament.rejectionReason = rejectionReason;
    }

    await tournament.save();

    res.json({
      success: true,
      message: `Tournament ${status}`,
      tournament
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyParticipantResult = async (req, res) => {
  try {
    const { tournamentId, participantId, kills, finalRank, status: resultStatus } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const participant = tournament.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    participant.kills = kills;
    participant.finalRank = finalRank;
    participant.status = resultStatus;

    if (resultStatus === 'verified') {
      const prizeForRank = tournament.prizeDistribution.find(p => p.rank === finalRank);
      if (prizeForRank) {
        participant.coinsWon = prizeForRank.coins;

        const user = await User.findById(participant.userId);
        if (user) {
          const balanceBefore = user.coinBalance;
          user.coinBalance += prizeForRank.coins;
          user.totalCoinsEarned += prizeForRank.coins;
          user.gameStats.totalWins += finalRank === 1 ? 1 : 0;
          user.gameStats.totalKills += kills;
          await user.save();

          await Transaction.create({
            userId: user._id,
            transactionType: 'credit',
            amount: prizeForRank.coins,
            balanceBefore,
            balanceAfter: user.coinBalance,
            category: 'tournament_win',
            description: `Prize for rank ${finalRank} in ${tournament.title}`,
            relatedTournament: tournament._id,
            processedBy: req.user._id,
            status: 'completed'
          });
        }
      }
    }

    await tournament.save();

    res.json({
      success: true,
      message: 'Participant result updated',
      tournament
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTournamentStats = async (req, res) => {
  try {
    const totalTournaments = await Tournament.countDocuments();
    const pendingApproval = await Tournament.countDocuments({ status: 'pending' });
    const liveTournaments = await Tournament.countDocuments({ status: 'live' });
    const completedTournaments = await Tournament.countDocuments({ status: 'completed' });

    const totalPrizePool = await Tournament.aggregate([
      { $match: { status: { $in: ['approved', 'live', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$prizePool' } } }
    ]);

    const totalEntryFees = await Tournament.aggregate([
      { $match: { status: { $in: ['live', 'completed'] } } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$entryFee', '$currentParticipants'] } } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalTournaments,
        pendingApproval,
        liveTournaments,
        completedTournaments,
        totalPrizePool: totalPrizePool[0]?.total || 0,
        totalEntryFees: totalEntryFees[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createTournament = async (req, res) => {
  try {
    const {
      title,
      description,
      gameType,
      category,
      subCategory,
      mode,
      entryFee,
      prizePool,
      maxParticipants,
      prizeDistribution,
      scheduledDate,
      rules,
      bannerImage,
      streaming
    } = req.body;

    // Validate streaming data if provided
    if (streaming && streaming.enabled) {
      if (!streaming.streamUrl || streaming.streamUrl.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Stream URL is required when streaming is enabled' 
        });
      }

      // Validate URL format
      try {
        new URL(streaming.streamUrl);
      } catch {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid stream URL format' 
        });
      }
    }

    const tournament = await Tournament.create({
      title,
      description,
      gameType,
      category,
      subCategory: subCategory || null,
      mode: mode || null,
      createdBy: req.user._id,
      entryFee,
      prizePool,
      maxParticipants,
      prizeDistribution,
      scheduledDate,
      rules,
      bannerImage,
      status: 'approved',
      streaming: streaming || {
        enabled: false,
        platform: 'None',
        streamUrl: '',
        streamTitle: '',
        streamStatus: 'not_started'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    await tournament.deleteOne();

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (tournament.status !== 'approved' && tournament.status !== 'live') {
      return res.status(400).json({ 
        success: false, 
        message: 'Tournament is not available for registration' 
      });
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tournament is full' 
      });
    }

    const alreadyJoined = tournament.participants.some(
      participant => participant.userId.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already joined this tournament' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.coinBalance < tournament.entryFee) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. You need ${tournament.entryFee} AX coins` 
      });
    }

    const balanceBefore = user.coinBalance;
    user.coinBalance -= tournament.entryFee;
    user.totalCoinsSpent = (user.totalCoinsSpent || 0) + tournament.entryFee;
    user.gameStats.tournamentsParticipated = (user.gameStats.tournamentsParticipated || 0) + 1;
    await user.save();

    tournament.participants.push({
      userId: userId,
      username: user.username,
      kills: 0,
      finalRank: 0,
      coinsWon: 0,
      status: 'pending'
    });

    tournament.currentParticipants += 1;
    await tournament.save();

    await Transaction.create({
      userId: userId,
      transactionType: 'debit',
      amount: tournament.entryFee,
      balanceBefore: balanceBefore,
      balanceAfter: user.coinBalance,
      category: 'tournament_entry',
      description: `Entry fee for ${tournament.title}`,
      relatedTournament: tournament._id,
      status: 'completed'
    });

    const updatedTournament = await Tournament.findById(tournamentId)
      .populate('createdBy', 'username email phoneNumber')
      .populate('participants.userId', 'username email')
      .populate('adminApprovedBy', 'username');

    res.json({
      success: true,
      message: 'Successfully joined the tournament',
      tournament: updatedTournament,
      userBalance: user.coinBalance
    });

    setImmediate(async () => {
      try {
        const notification = await createAdminNotification(
          'tournament_joined',
          'User Joined Tournament',
          `${user.username} joined "${tournament.title}"`,
          user._id,
          { id: tournament._id, model: 'Tournament' },
          { entryFee: tournament.entryFee, tournamentTitle: tournament.title }
        );

        // Emit socket event for real-time notification
        if (req.io) {
          req.io.emit('admin_notification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            relatedUser: {
              _id: user._id,
              username: user.username
            },
            relatedEntity: {
              id: tournament._id,
              title: tournament.title
            },
            createdAt: notification.createdAt
          });
        }
      } catch (error) {
        console.error('Failed to create admin notification:', error);
      }
    });

  } catch (error) {
    console.error('Join tournament error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTournament = async (req, res) => {
  try {
    const {
      title,
      description,
      gameType,
      category,
      subCategory,
      mode,
      entryFee,
      prizePool,
      maxParticipants,
      prizeDistribution,
      scheduledDate,
      rules,
      bannerImage,
      status,
      streaming
    } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    // Validate streaming data if being updated
    if (streaming && streaming.enabled) {
      if (!streaming.streamUrl || streaming.streamUrl.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Stream URL is required when streaming is enabled' 
        });
      }

      // Validate URL format
      try {
        new URL(streaming.streamUrl);
      } catch {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid stream URL format' 
        });
      }
    }

    if (title) tournament.title = title;
    if (description) tournament.description = description;
    if (gameType) tournament.gameType = gameType;
    if (category) tournament.category = category;
    if (subCategory !== undefined) tournament.subCategory = subCategory;
    if (mode !== undefined) tournament.mode = mode;
    if (entryFee !== undefined) tournament.entryFee = entryFee;
    if (prizePool !== undefined) tournament.prizePool = prizePool;
    if (maxParticipants !== undefined) tournament.maxParticipants = maxParticipants;
    if (prizeDistribution) tournament.prizeDistribution = prizeDistribution;
    if (scheduledDate) tournament.scheduledDate = scheduledDate;
    if (rules) tournament.rules = rules;
    if (bannerImage) tournament.bannerImage = bannerImage;
    if (status) tournament.status = status;
    
    // Update streaming configuration
    if (streaming !== undefined) {
      tournament.streaming = {
        enabled: streaming.enabled || false,
        platform: streaming.platform || 'None',
        streamUrl: streaming.streamUrl || '',
        streamTitle: streaming.streamTitle || '',
        streamStatus: streaming.streamStatus || tournament.streaming?.streamStatus || 'not_started'
      };
    }

    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('adminApprovedBy', 'username');

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: updatedTournament
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    const participantIndex = tournament.participants.findIndex(
      p => p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Participant not found' 
      });
    }

    const participant = tournament.participants[participantIndex];
    const userId = participant.userId;

    const user = await User.findById(userId);
    if (user) {
      const balanceBefore = user.coinBalance;
      user.coinBalance += tournament.entryFee;
      user.totalCoinsSpent = Math.max(0, (user.totalCoinsSpent || 0) - tournament.entryFee);
      user.gameStats.tournamentsParticipated = Math.max(0, (user.gameStats.tournamentsParticipated || 0) - 1);
      await user.save();

      await Transaction.create({
        userId: userId,
        transactionType: 'credit',
        amount: tournament.entryFee,
        balanceBefore: balanceBefore,
        balanceAfter: user.coinBalance,
        category: 'refund',
        description: `Refund for removal from ${tournament.title}`,
        relatedTournament: tournament._id,
        processedBy: req.user._id,
        status: 'completed'
      });
    }

    tournament.participants.splice(participantIndex, 1);
    tournament.currentParticipants = Math.max(0, tournament.currentParticipants - 1);
    await tournament.save();

    const updatedTournament = await Tournament.findById(tournamentId)
      .populate('createdBy', 'username email')
      .populate('participants.userId', 'username email')
      .populate('adminApprovedBy', 'username');

    res.json({
      success: true,
      message: 'Participant removed and refunded successfully',
      tournament: updatedTournament
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateStreamStatus = async (req, res) => {
  try {
    const { streamStatus } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    if (!tournament.streaming.enabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'Streaming is not enabled for this tournament' 
      });
    }

    tournament.streaming.streamStatus = streamStatus;
    await tournament.save();

    res.json({
      success: true,
      message: `Stream status updated to ${streamStatus}`,
      tournament
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
