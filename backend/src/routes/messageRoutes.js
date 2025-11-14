import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getTournamentMessages,
  sendMessage,
  updateMessage,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get messages for a tournament
router.get('/tournament/:tournamentId', getTournamentMessages);

// Send a message to a tournament chat
router.post('/tournament/:tournamentId', sendMessage);

// Update a message (user can update their own messages)
router.put('/:messageId', updateMessage);

// Delete a message (admin only)
router.delete('/:messageId', deleteMessage);

export default router;
