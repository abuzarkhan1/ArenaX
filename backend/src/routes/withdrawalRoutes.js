import express from 'express';
import {
  createWithdrawalRequest,
  getUserWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
} from '../controllers/withdrawalController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createWithdrawalRequest);
router.get('/my-withdrawals', protect, getUserWithdrawals);

// Admin routes
router.get('/all', protect, adminOnly, getAllWithdrawals);
router.patch('/:id', protect, adminOnly, updateWithdrawalStatus);

export default router;