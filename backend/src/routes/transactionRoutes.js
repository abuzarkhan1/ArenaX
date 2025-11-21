import express from 'express';
import {
  getAllTransactions,
  getTransactionStats,
  getWalletOverview,
  getUserTransactions,
  exportTransactions,
  getTransactionTrends
} from '../controllers/transactionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/all', protect, adminOnly, getAllTransactions);
router.get('/stats', protect, adminOnly, getTransactionStats);
router.get('/wallet-overview', protect, adminOnly, getWalletOverview);
router.get('/export', protect, adminOnly, exportTransactions);
router.get('/trends', protect, adminOnly, getTransactionTrends);

// User routes
router.get('/my-transactions', protect, getUserTransactions);

export default router;
