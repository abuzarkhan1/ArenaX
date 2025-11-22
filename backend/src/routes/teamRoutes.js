import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import {
    createTeam,
    joinTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    leaveTeam,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create uploads/teams directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/teams');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for team logo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'team-logo-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// All routes require authentication
router.use(protect);

// Team routes
router.post('/', upload.single('logo'), createTeam);
router.post('/join', joinTeam);
router.get('/my-teams', getMyTeams);
router.get('/:id', getTeamById);
router.put('/:id', upload.single('logo'), updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/leave', leaveTeam);

export default router;
