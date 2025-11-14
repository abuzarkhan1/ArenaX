import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  adjustUserCoins,
  getUserStats,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public route for updating push token (only needs authentication)

// Admin-only routes
router.use(protect);
router.use(adminOnly);

router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.post('/:id/coins', adjustUserCoins);

export default router;
