import express from 'express';
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  getAdminNotificationCount
} from '../controllers/adminNotificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Admin notification routes
router.use(protect);
router.use(adminOnly);

router.get('/', getAdminNotifications);
router.get('/count', getAdminNotificationCount);
router.patch('/:id/read', markAdminNotificationAsRead);
router.patch('/mark-all-read', markAllAdminNotificationsAsRead);

export default router;
