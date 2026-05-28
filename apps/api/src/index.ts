import './loadEnv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import path from 'path';
import { connectDB } from './config/db';
import { initializeWebSocketServer } from './services/websocket.service';
import { initializePaperWorker } from './queues/paper.worker';
import assignmentRouter from './routes/assignment.routes';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import groupRouter from './routes/group.routes';
import libraryRouter from './routes/library.routes';
import notificationRouter from './routes/notification.routes';
import statsRouter from './routes/stats.routes';

// Env vars are loaded at the top via './loadEnv'

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const httpServer = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize WebSocket server
initializeWebSocketServer(httpServer);

// Initialize BullMQ Workers
initializePaperWorker();

// Middlewares
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploads directory statically (for dev preview/downloads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/v1', assignmentRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/groups', groupRouter);
app.use('/api/library', libraryRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[server-error]:', err.stack || err.message || err);
  
  // Intercept Mongoose CastError (e.g. invalid MongoDB ObjectId format) to prevent internal details disclosure
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
  });
});

// Start listening
httpServer.listen(PORT, () => {
  console.log(`[server]: VedaAI API + WebSockets listening on port ${PORT}`);
  console.log(`[server]: AI Config - Groq Key Loaded: ${process.env.GROQ_API_KEY ? '✅ YES' : '❌ NO'}`);
  console.log(`[server]: AI Config - OpenAI Key Loaded: ${process.env.OPENAI_API_KEY ? '✅ YES' : '❌ NO'}`);
});
