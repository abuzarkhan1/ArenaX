import express from 'express';
import {
  createDepositRequest,
  getUserDeposits,
  getAllDeposits,
  updateDepositStatus
} from '../controllers/depositController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Player routes
router.post('/', protect, createDepositRequest);
router.get('/my-deposits', protect, getUserDeposits);

// Admin routes
router.get('/all', protect, adminOnly, getAllDeposits);
router.patch('/:id', protect, adminOnly, updateDepositStatus);

export default router;