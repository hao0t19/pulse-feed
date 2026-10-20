import { Router } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { createCommentSchema, listCommentsQuerySchema } from '../validation.js';

export const commentsRouter = Router({ mergeParams: true });

type CommentParams = { postId: string };

commentsRouter.post('/', async (req, res, next) => {
  try {
    const { postId } = req.params as CommentParams;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'invalid post id' });
      return;
    }

    const body = createCommentSchema.parse(req.body);
    const post = await Post.findById(postId).select('_id').lean();
    if (!post) {
      res.status(404).json({ error: 'post not found' });
      return;
    }

    const doc = await Comment.create({
      postId: post._id,
      authorId: body.authorId,
      authorName: body.authorName,
      body: body.body,
    });

    await Post.findByIdAndUpdate(postId, { $inc: { 'reactionCounts.comment': 1 } });

    res.status(201).json({
      id: doc._id.toString(),
      postId,
      authorId: doc.authorId,
      authorName: doc.authorName,
      body: doc.body,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

commentsRouter.get('/', async (req, res, next) => {
  try {
    const { postId } = req.params as CommentParams;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: 'invalid post id' });
      return;
    }

    const query = listCommentsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { postId: new mongoose.Types.ObjectId(postId) };
    if (query.cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(query.cursor) };
    }

    const rows = await Comment.find(filter).sort({ _id: -1 }).limit(query.limit).lean();
    const nextCursor = rows.length === query.limit ? String(rows[rows.length - 1]._id) : null;

    res.json({
      items: rows.map((row) => ({
        id: String(row._id),
        postId,
        authorId: row.authorId,
        authorName: row.authorName,
        body: row.body,
        createdAt: row.createdAt,
      })),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
});
