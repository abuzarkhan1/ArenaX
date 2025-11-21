import express from 'express';
import { getComprehensiveReports, exportReport } from '../controllers/reportsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/comprehensive', protect, adminOnly, getComprehensiveReports);

router.get('/export', protect, adminOnly, exportReport);

export default router;
