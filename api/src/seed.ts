import { Comment } from './models/Comment.js';
import { Post } from './models/Post.js';

export async function seedDemoFeed(): Promise<void> {
  const count = await Post.estimatedDocumentCount();
  if (count > 0) return;

  const now = Date.now();
  const posts = await Post.insertMany([
    {
      authorId: 'u-alex',
      authorName: 'Alex Chen',
      title: 'Flash sale tips',
      body: 'Queue early, watch stock WebSocket updates, and never trust client-side inventory counts.',
      tags: ['flashsale', 'engineering'],
      postType: 'text',
      reactionCounts: { like: 12, comment: 0 },
      createdAt: new Date(now - 7200_000),
    },
    {
      authorId: 'u-mei',
      authorName: 'Mei Lin',
      body: 'Shipping delays this week — ops is rerouting SG hub parcels. ETA +2 days for most orders.',
      tags: ['ops', 'singapore'],
      postType: 'text',
      reactionCounts: { like: 5, comment: 0 },
      createdAt: new Date(now - 5400_000),
    },
    {
      authorId: 'u-sam',
      authorName: 'Sam Rivera',
      title: 'Worth a read',
      body: 'MongoDB aggregation patterns for social feeds — solid write-up on tag rollups.',
      tags: ['mongodb', 'engineering'],
      postType: 'link',
      extras: { url: 'https://www.mongodb.com/docs/manual/aggregation/', hostname: 'mongodb.com' },
      reactionCounts: { like: 8, comment: 0 },
      createdAt: new Date(now - 3600_000),
    },
    {
      authorId: 'u-alex',
      authorName: 'Alex Chen',
      body: 'Who is joining the midnight drop test for checkout v2?',
      tags: ['flashsale', 'qa'],
      postType: 'text',
      reactionCounts: { like: 3, comment: 0 },
      createdAt: new Date(now - 900_000),
    },
  ]);

  const comments = [
    {
      postId: posts[0]._id,
      authorId: 'u-mei',
      authorName: 'Mei Lin',
      body: '+1 on WebSocket — poll fallback saved us last sprint.',
      createdAt: new Date(now - 6000_000),
    },
    {
      postId: posts[0]._id,
      authorId: 'u-sam',
      authorName: 'Sam Rivera',
      body: 'Also worth load-testing the idempotency keys.',
      createdAt: new Date(now - 5800_000),
    },
    {
      postId: posts[2]._id,
      authorId: 'u-alex',
      authorName: 'Alex Chen',
      body: 'The $unwind + $group section is what we use for tag trending.',
      createdAt: new Date(now - 3000_000),
    },
  ];

  await Comment.insertMany(comments);

  await Post.bulkWrite([
    { updateOne: { filter: { _id: posts[0]._id }, update: { $set: { 'reactionCounts.comment': 2 } } } },
    { updateOne: { filter: { _id: posts[2]._id }, update: { $set: { 'reactionCounts.comment': 1 } } } },
  ]);
}
