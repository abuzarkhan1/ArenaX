import express from 'express';
import {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournamentStatus,
  verifyParticipantResult,
  getTournamentStats,
  deleteTournament,
  joinTournament,
  updateTournament,
  removeParticipant
} from '../controllers/tournamentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllTournaments);
router.get('/stats', getTournamentStats);
router.get('/:id', getTournamentById);
router.post('/verify-result', verifyParticipantResult);
router.post('/:id/join', joinTournament);

// Admin-only routes
router.post('/', adminOnly, createTournament);
router.put('/:id', adminOnly, updateTournament);
router.put('/:id/status', adminOnly, updateTournamentStatus);
router.delete('/:id', adminOnly, deleteTournament);
router.delete('/:tournamentId/participants/:participantId', adminOnly, removeParticipant);

export default router;