import express from 'express';
import {
  getAllTransactions,
  getTransactionStats,
  getUserTransactions,
  getWalletOverview
} from '../controllers/transactionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/user/me', protect, getUserTransactions);


router.get('/', protect, adminOnly, getAllTransactions);
router.get('/stats', protect, adminOnly, getTransactionStats);
router.get('/wallet/overview', protect, adminOnly,getWalletOverview);

export default router;
