import Notification from '../models/Notification.js';
import UserNotification from '../models/UserNotification.js';
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
      link
    } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type,
      targetAudience,
      specificUsers,
      relatedTournament,
      link: link || null,
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
      users = await User.find().select('pushToken');
    } else if (notification.targetAudience === 'players') {
      users = await User.find({ role: 'player' }).select('pushToken');
    } else if (notification.targetAudience === 'specific' && notification.specificUsers.length > 0) {
      users = await User.find({ 
        _id: { $in: notification.specificUsers }
      }).select('pushToken');
    }

    // Create user notifications for all targeted users
    const userNotifications = users.map(user => ({
      user: user._id,
      notification: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      relatedTournament: notification.relatedTournament,
      isRead: false
    }));

    await UserNotification.insertMany(userNotifications);

    // Extract push tokens for users who have them
    const pushTokens = users
      .map(user => user.pushToken)
      .filter(token => token);

    // Send push notifications
    if (pushTokens.length > 0) {
      const notificationData = {
        notificationId: notification._id.toString(),
        type: notification.type,
        relatedTournament: notification.relatedTournament?.toString()
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

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();

    // Emit via socket for real-time updates
    if (req.io) {
      req.io.emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        link: notification.link,
        sentAt: notification.sentAt
      });
    }

    res.json({
      success: true,
      message: `Notification sent successfully to ${users.length} users`,
      notification,
      usersSent: users.length,
      devicesSent: pushTokens.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendBulkNotification = async (req, res) => {
  try {
    const { title, message, type, link } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type: type || 'announcement',
      targetAudience: 'all',
      link: link || null,
      status: 'sent',
      sentAt: new Date(),
      createdBy: req.user._id
    });

    // Get all users
    const users = await User.find().select('pushToken');

    // Create user notifications for all users
    const userNotifications = users.map(user => ({
      user: user._id,
      notification: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      isRead: false
    }));

    await UserNotification.insertMany(userNotifications);

    // Extract push tokens
    const pushTokens = users
      .map(user => user.pushToken)
      .filter(token => token);

    // Send push notifications
    if (pushTokens.length > 0) {
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

    // Emit via socket
    if (req.io) {
      req.io.emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        link: notification.link,
        sentAt: notification.sentAt
      });
    }

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      notification,
      usersSent: users.length,
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

// NEW: Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await UserNotification.find({ user: req.user._id })
      .populate('relatedTournament', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserNotification.countDocuments({ user: req.user._id });
    const unreadCount = await UserNotification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
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

// NEW: Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await UserNotification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};