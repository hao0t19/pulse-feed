const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8081';

export type PostItem = {
  id: string;
  authorId: string;
  authorName: string;
  title?: string;
  body: string;
  tags: string[];
  postType: string;
  extras: Record<string, unknown>;
  reactionCounts: { like: number; comment: number };
  createdAt: string;
};

export type CommentItem = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type SummaryResponse = {
  windowHours: number;
  since: string;
  totalPosts: number;
  topTags: { tag: string; count: number }[];
  topAuthors: { authorId: string; authorName: string; count: number }[];
};

const DEMO_USER = { id: 'u-demo', name: 'Demo User' };

export async function fetchPosts(params: Record<string, string>): Promise<{
  items: PostItem[];
  nextCursor: string | null;
}> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}/api/posts?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`posts ${res.status}`);
  return res.json();
}

export async function fetchSummary(): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE}/api/summary?hours=24`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`summary ${res.status}`);
  return res.json();
}

export async function fetchComments(postId: string): Promise<{ items: CommentItem[] }> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`comments ${res.status}`);
  return res.json();
}

export async function createPost(input: {
  body: string;
  title?: string;
  tags: string[];
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorId: DEMO_USER.id,
      authorName: DEMO_USER.name,
      body: input.body,
      title: input.title,
      tags: input.tags,
      postType: 'text',
    }),
  });
  if (!res.ok) throw new Error(`create post ${res.status}`);
}

export async function likePost(postId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: DEMO_USER.id }),
  });
  if (res.status === 409) return;
  if (!res.ok) throw new Error(`like ${res.status}`);
}

export async function addComment(postId: string, body: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorId: DEMO_USER.id,
      authorName: DEMO_USER.name,
      body,
    }),
  });
  if (!res.ok) throw new Error(`comment ${res.status}`);
}
