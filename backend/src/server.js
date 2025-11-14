import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import depositRoutes from './routes/depositRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);

// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

export { io };

// Connect to database
connectDB();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'exp://localhost:8081',
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

// Body parser middleware with increased limit for file uploads (screenshots)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join tournament chat room
  socket.on('join_tournament_chat', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
    console.log(`Socket ${socket.id} joined tournament_${tournamentId}`);
  });

  // Leave tournament chat room
  socket.on('leave_tournament_chat', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
    console.log(`Socket ${socket.id} left tournament_${tournamentId}`);
  });

  // Handle typing indicators (optional)
  socket.on('typing', ({ tournamentId, username }) => {
    socket.to(`tournament_${tournamentId}`).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ tournamentId, username }) => {
    socket.to(`tournament_${tournamentId}`).emit('user_stop_typing', { username });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ArenaX API is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/deposits', depositRoutes);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`ArenaX Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO server is ready`);
});