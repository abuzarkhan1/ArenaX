import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import reportsRoutes from './routes/reports.js';
import { initializeDefaultSettings } from './seeders/settingsSeeder.js';
import logger from './config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);

// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }
});

export { io };

connectDB().then(() => {
  initializeDefaultSettings();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://192.168.50.190:5000',
  'http://10.0.2.2:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan('combined', { stream: logger.stream }));

app.use('/uploads', express.static(join(__dirname, '../uploads')));

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('join_tournament_chat', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
    logger.info(`Socket ${socket.id} joined tournament_${tournamentId}`);
  });

  socket.on('leave_tournament_chat', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
    logger.info(`Socket ${socket.id} left tournament_${tournamentId}`);
  });

  socket.on('typing', ({ tournamentId, username }) => {
    socket.to(`tournament_${tournamentId}`).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ tournamentId, username }) => {
    socket.to(`tournament_${tournamentId}`).emit('user_stop_typing', { username });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ArenaX API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin-notifications', adminNotificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/reports', reportsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`ArenaX Backend Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Socket.IO server is ready`);
});