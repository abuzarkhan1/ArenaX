import AdminNotification from '../models/AdminNotification.js';
import logger from '../config/logger.js';

export const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;

    const notifications = await AdminNotification.find(query)
      .populate('relatedUser', 'username email')
      .populate({
        path: 'relatedEntity.id',
        select: 'title amount status'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminNotification.countDocuments(query);
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

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
    logger.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AdminNotification.findById(id);
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
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminNotificationCount = async (req, res) => {
  try {
    const count = await AdminNotification.countDocuments({ isRead: false });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Error getting notification count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to create admin notification
export const createAdminNotification = async (type, title, message, relatedUser, relatedEntity = null, metadata = {}) => {
  try {
    const notification = await AdminNotification.create({
      type,
      title,
      message,
      relatedUser,
      relatedEntity,
      metadata
    });

    return notification;
  } catch (error) {
    logger.error('Error creating admin notification:', error);
    throw error;
  }
};
