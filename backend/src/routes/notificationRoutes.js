import express from 'express';
import {
  createNotification,
  getAllNotifications,
  sendNotification,
  sendBulkNotification,
  deleteNotification,
  getNotificationStats,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// User routes (protected, no admin required)
router.get('/user/notifications', protect, getUserNotifications);
router.get('/user/unread-count', protect, getUnreadCount);
router.patch('/user/notifications/:id/read', protect, markNotificationAsRead);
router.patch('/user/notifications/mark-all-read', protect, markAllNotificationsAsRead);

// Admin routes
router.use(protect);
router.use(adminOnly);

router.post('/', createNotification);
router.get('/', getAllNotifications);
router.get('/stats', getNotificationStats);
router.post('/send-bulk', sendBulkNotification);
router.post('/:id/send', sendNotification);
router.delete('/:id', deleteNotification);

export default router;