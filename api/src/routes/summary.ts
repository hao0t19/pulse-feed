import { Router } from 'express';
import { z } from 'zod';
import { Post } from '../models/Post.js';

export const summaryRouter = Router();

const summaryQuerySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).default(24),
});

summaryRouter.get('/', async (req, res, next) => {
  try {
    const { hours } = summaryQuerySchema.parse(req.query);
    const since = new Date(Date.now() - hours * 3600_000);
    const match = { createdAt: { $gte: since } };

    const [byTag, byAuthor, total] = await Promise.all([
      Post.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      Post.aggregate<{ _id: string; count: number; authorName: string }>([
        { $match: match },
        {
          $group: {
            _id: '$authorId',
            count: { $sum: 1 },
            authorName: { $first: '$authorName' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Post.countDocuments(match),
    ]);

    res.json({
      windowHours: hours,
      since,
      totalPosts: total,
      topTags: byTag.map((row) => ({ tag: row._id, count: row.count })),
      topAuthors: byAuthor.map((row) => ({
        authorId: row._id,
        authorName: row.authorName ?? row._id,
        count: row.count,
      })),
    });
  } catch (err) {
    next(err);
  }
});
