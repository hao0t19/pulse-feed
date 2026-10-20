import { Router } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { PostLike } from '../models/PostLike.js';
import {
  buildPostFilter,
  createPostSchema,
  likePostSchema,
  listPostsQuerySchema,
} from '../validation.js';

export const postsRouter = Router();

function mapPost(row: {
  _id: mongoose.Types.ObjectId;
  authorId: string;
  authorName: string;
  title?: string | null;
  body: string;
  tags: string[];
  postType: string;
  extras?: Record<string, unknown>;
  reactionCounts?: { like?: number; comment?: number };
  createdAt: Date;
}) {
  return {
    id: String(row._id),
    authorId: row.authorId,
    authorName: row.authorName,
    title: row.title ?? undefined,
    body: row.body,
    tags: row.tags,
    postType: row.postType,
    extras: row.extras ?? {},
    reactionCounts: {
      like: row.reactionCounts?.like ?? 0,
      comment: row.reactionCounts?.comment ?? 0,
    },
    createdAt: row.createdAt,
  };
}

postsRouter.post('/', async (req, res, next) => {
  try {
    const body = createPostSchema.parse(req.body);
    const doc = await Post.create(body);
    res.status(201).json({ id: doc._id.toString(), createdAt: doc.createdAt });
  } catch (err) {
    next(err);
  }
});

postsRouter.get('/', async (req, res, next) => {
  try {
    const query = listPostsQuerySchema.parse(req.query);
    const filter = buildPostFilter(query);
    if (query.cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(query.cursor) };
    }

    const rows = await Post.find(filter).sort({ _id: -1 }).limit(query.limit).lean();
    const nextCursor = rows.length === query.limit ? String(rows[rows.length - 1]._id) : null;

    res.json({
      items: rows.map((row) => mapPost(row)),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
});

postsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid post id' });
      return;
    }
    const row = await Post.findById(id).lean();
    if (!row) {
      res.status(404).json({ error: 'post not found' });
      return;
    }
    res.json(mapPost(row));
  } catch (err) {
    next(err);
  }
});

postsRouter.post('/:id/like', async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'invalid post id' });
      return;
    }
    const { userId } = likePostSchema.parse(req.body);

    const post = await Post.findById(postId).select('_id').lean();
    if (!post) {
      res.status(404).json({ error: 'post not found' });
      return;
    }

    try {
      await PostLike.create({ postId: post._id, userId });
    } catch (err) {
      if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
        res.status(409).json({ error: 'already liked' });
        return;
      }
      throw err;
    }

    const updated = await Post.findByIdAndUpdate(
      postId,
      { $inc: { 'reactionCounts.like': 1 } },
      { new: true },
    ).lean();

    res.json({
      liked: true,
      reactionCounts: {
        like: updated?.reactionCounts?.like ?? 0,
        comment: updated?.reactionCounts?.comment ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
