import express from 'express';
import {
  getAllSettings,
  getSetting,
  updateSetting,
  createSetting,
  deleteSetting
} from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/', getAllSettings);
router.get('/:key', getSetting);
router.post('/', createSetting);
router.put('/:key', updateSetting);
router.delete('/:key', deleteSetting);

export default router;
