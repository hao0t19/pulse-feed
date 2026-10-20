import { describe, expect, it } from 'vitest';
import { buildPostFilter, listPostsQuerySchema } from './validation.js';

describe('buildPostFilter', () => {
  it('maps query fields to MongoDB filter', () => {
    const from = new Date('2025-01-01T00:00:00.000Z');
    const to = new Date('2025-01-02T00:00:00.000Z');
    const parsed = listPostsQuerySchema.parse({
      tag: 'flashsale',
      authorId: 'u-alex',
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 25,
    });

    expect(buildPostFilter(parsed)).toEqual({
      tags: 'flashsale',
      authorId: 'u-alex',
      createdAt: { $gte: from, $lte: to },
    });
  });
});
