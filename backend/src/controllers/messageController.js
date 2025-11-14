import Message from '../models/Message.js';
import Tournament from '../models/Tournament.js';

// Get all messages for a tournament
export const getTournamentMessages = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Check if user is admin or has joined the tournament
    const isAdmin = req.user.role === 'admin';
    const hasJoined = tournament.participants.some(
      participant => participant.userId.toString() === userId.toString()
    );

    if (!isAdmin && !hasJoined) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must join the tournament to view chat messages' 
      });
    }

    // Fetch messages
    const messages = await Message.find({ tournamentId })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Check if user is admin or has joined the tournament
    const isAdmin = req.user.role === 'admin';
    const hasJoined = tournament.participants.some(
      participant => participant.userId.toString() === userId.toString()
    );

    if (!isAdmin && !hasJoined) {
      return res.status(403).json({ 
        success: false, 
        message: 'You must join the tournament to send messages' 
      });
    }

    // Create message
    const newMessage = await Message.create({
      tournamentId,
      userId,
      username: req.user.username,
      message: message.trim(),
      senderRole: req.user.role,
      isSystemMessage: false
    });

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(`tournament_${tournamentId}`).emit('new_message', newMessage);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a message (user can update their own messages)
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newMessageText } = req.body;
    const userId = req.user._id;

    if (!newMessageText || newMessageText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user owns the message
    if (message.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own messages' 
      });
    }

    // Update message
    message.message = newMessageText.trim();
    await message.save();

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(`tournament_${message.tournamentId}`).emit('message_updated', message);
    }

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a message (admin only)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Only admins can delete messages
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can delete messages' 
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await message.deleteOne();

    // Emit socket event
    if (req.io) {
      req.io.to(`tournament_${message.tournamentId}`).emit('message_deleted', { messageId });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
