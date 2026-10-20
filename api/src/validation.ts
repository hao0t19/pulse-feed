import { z } from 'zod';

const tagSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, 'tag must be alphanumeric with optional hyphens');

export const createPostSchema = z.object({
  authorId: z.string().min(1).max(128),
  authorName: z.string().min(1).max(128),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(8000),
  tags: z.array(tagSchema).max(8).default([]),
  postType: z.enum(['text', 'link']).default('text'),
  extras: z.record(z.string(), z.unknown()).optional(),
});

export const listPostsQuerySchema = z.object({
  tag: z.string().optional(),
  authorId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export function buildPostFilter(query: ListPostsQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.tag) filter.tags = query.tag;
  if (query.authorId) filter.authorId = query.authorId;
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = query.from;
    if (query.to) createdAt.$lte = query.to;
    filter.createdAt = createdAt;
  }
  return filter;
}

export const createCommentSchema = z.object({
  authorId: z.string().min(1).max(128),
  authorName: z.string().min(1).max(128),
  body: z.string().min(1).max(2000),
});

export const likePostSchema = z.object({
  userId: z.string().min(1).max(128),
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});
