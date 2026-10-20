import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { commentsRouter } from './routes/comments.js';
import { postsRouter } from './routes/posts.js';
import { summaryRouter } from './routes/summary.js';
import { seedDemoFeed } from './seed.js';

async function main(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  if (config.seedDemoData) {
    await seedDemoFeed();
    console.log('Demo seed checked');
  }

  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
  });

  postsRouter.use('/:postId/comments', commentsRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/summary', summaryRouter);
  app.use(errorHandler);

  app.listen(config.httpPort, () => {
    console.log(`API listening on :${config.httpPort}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
