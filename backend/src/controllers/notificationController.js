import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotifications } from '../services/pushNotification.js';

export const createNotification = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      type, 
      targetAudience, 
      specificUsers, 
      relatedTournament, 
      isScheduled, 
      scheduledFor,
      link // NEW: Accept link from request
    } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type,
      targetAudience,
      specificUsers,
      relatedTournament,
      link: link || null, // NEW: Store link if provided
      isScheduled,
      scheduledFor: isScheduled ? scheduledFor : null,
      status: isScheduled ? 'scheduled' : 'draft',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Notification created',
      notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('createdBy', 'username')
      .populate('relatedTournament', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
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

export const sendNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Get users based on target audience
    let users = [];
    if (notification.targetAudience === 'all') {
      users = await User.find({ pushToken: { $exists: true, $ne: null } }).select('pushToken');
    } else if (notification.targetAudience === 'players') {
      users = await User.find({ 
        role: 'player', 
        pushToken: { $exists: true, $ne: null } 
      }).select('pushToken');
    } else if (notification.targetAudience === 'specific' && notification.specificUsers.length > 0) {
      users = await User.find({ 
        _id: { $in: notification.specificUsers },
        pushToken: { $exists: true, $ne: null }
      }).select('pushToken');
    }

    // Extract push tokens
    const pushTokens = users.map(user => user.pushToken).filter(token => token);

    // Send push notifications
    if (pushTokens.length > 0) {
      // NEW: Include link in notification data if available
      const notificationData = {
        notificationId: notification._id.toString(),
        type: notification.type,
        relatedTournament: notification.relatedTournament?.toString()
      };

      // Add link to data if it exists
      if (notification.link) {
        notificationData.link = notification.link;
      }

      await sendPushNotifications(pushTokens, {
        title: notification.title,
        body: notification.message,
        data: notificationData
      });
    }

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    // Also emit via socket for real-time updates in web admin
    if (req.io) {
      req.io.emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        link: notification.link, // NEW: Include link in socket emit
        sentAt: notification.sentAt
      });
    }

    res.json({
      success: true,
      message: `Notification sent successfully to ${pushTokens.length} devices`,
      notification,
      devicesSent: pushTokens.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendBulkNotification = async (req, res) => {
  try {
    const { title, message, type, link } = req.body; // NEW: Accept link

    const notification = await Notification.create({
      title,
      message,
      type: type || 'announcement',
      targetAudience: 'all',
      link: link || null, // NEW: Store link if provided
      status: 'sent',
      sentAt: new Date(),
      createdBy: req.user._id
    });

    // Get all users with push tokens
    const users = await User.find({ 
      pushToken: { $exists: true, $ne: null } 
    }).select('pushToken');

    const pushTokens = users.map(user => user.pushToken).filter(token => token);

    // Send push notifications
    if (pushTokens.length > 0) {
      // NEW: Include link in notification data if available
      const notificationData = {
        notificationId: notification._id.toString(),
        type: notification.type
      };

      if (notification.link) {
        notificationData.link = notification.link;
      }

      await sendPushNotifications(pushTokens, {
        title: notification.title,
        body: notification.message,
        data: notificationData
      });
    }

    // Also emit via socket for real-time updates
    if (req.io) {
      req.io.emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        link: notification.link, // NEW: Include link
        sentAt: notification.sentAt
      });
    }

    res.json({
      success: true,
      message: `Notification sent to ${pushTokens.length} devices`,
      notification,
      devicesSent: pushTokens.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const sentNotifications = await Notification.countDocuments({ status: 'sent' });
    const scheduledNotifications = await Notification.countDocuments({ status: 'scheduled' });
    const draftNotifications = await Notification.countDocuments({ status: 'draft' });

    res.json({
      success: true,
      stats: {
        totalNotifications,
        sentNotifications,
        scheduledNotifications,
        draftNotifications
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};