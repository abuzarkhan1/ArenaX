import express from 'express';
import {
  createNotification,
  getAllNotifications,
  sendNotification,
  sendBulkNotification,
  deleteNotification,
  getNotificationStats
} from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.post('/', createNotification);
router.get('/', getAllNotifications);
router.get('/stats', getNotificationStats);
router.post('/send-bulk', sendBulkNotification);
router.post('/:id/send', sendNotification);
router.delete('/:id', deleteNotification);



export default router;
