import express from 'express';
import cors from 'cors';
import { apiRouter } from './api';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), service: 'CineVault Backend API' });
});

const PORT = process.env.PORT || 5000;

if (process.argv.includes('--listen')) {
  app.listen(PORT, () => {
    console.log(`🎬 CineVault API Server running on port ${PORT}`);
  });
}
