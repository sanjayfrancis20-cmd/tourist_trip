import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import expenseRoutes from './routes/expenses';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-travel-planner';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/trips', expenseRoutes); // Expense routes are nested under /api/trips

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AI Travel Planner Backend is running' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Connect to MongoDB & Start Server
console.log('[Database] Connecting to MongoDB...');
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[Database] MongoDB connected successfully.');
    app.listen(PORT, () => {
      console.log(`[Server] Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database] MongoDB connection failed:', err);
    process.exit(1);
  });
