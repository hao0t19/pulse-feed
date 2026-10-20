'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CommentItem, PostItem, SummaryResponse } from '@/lib/api';
import {
  addComment,
  createPost,
  fetchComments,
  fetchPosts,
  fetchSummary,
  likePost,
} from '@/lib/api';

function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

export default function HomePage() {
  const [tag, setTag] = useState('');
  const [items, setItems] = useState<PostItem[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});
  const [newBody, setNewBody] = useState('');
  const [newTags, setNewTags] = useState('engineering');
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (tag) params.tag = tag;
      const [posts, sum] = await Promise.all([fetchPosts(params), fetchSummary()]);
      setItems(posts.items);
      setSummary(sum);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleComments = async (postId: string) => {
    if (expanded === postId) {
      setExpanded(null);
      return;
    }
    setExpanded(postId);
    if (!comments[postId]) {
      const data = await fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data.items }));
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pulse Feed</h1>
        <p className="mt-2 text-sm text-slate-400">
          UGC feed demo — posts, tags, likes, and comments in MongoDB. Pairs with FlashSale
          (PostgreSQL orders) as the social content side of the same fictional commerce platform.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Posts (24h)</p>
          <p className="mt-2 text-3xl font-semibold">{summary?.totalPosts ?? '—'}</p>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Trending tags</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {(summary?.topTags ?? []).slice(0, 8).map((row) => (
              <li key={row.tag}>
                <button
                  type="button"
                  onClick={() => setTag(row.tag)}
                  className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
                >
                  #{row.tag} <span className="text-slate-500">({row.count})</span>
                </button>
              </li>
            ))}
            {!summary?.topTags?.length && <li className="text-slate-500">No data yet</li>}
          </ul>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-medium text-slate-300">New post</h2>
        <textarea
          className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          rows={3}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Share an update with the team…"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="tags (comma separated)"
          />
          <button
            type="button"
            disabled={!newBody.trim()}
            onClick={async () => {
              await createPost({ body: newBody.trim(), tags: parseTags(newTags) });
              setNewBody('');
              await reload();
            }}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-40"
          >
            Publish
          </button>
        </div>
      </section>

      <section className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Filter by tag</span>
          <input
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="flashsale"
          />
        </label>
        <button
          type="button"
          onClick={reload}
          className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setTag('');
          }}
          className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Clear
        </button>
      </section>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      <ul className="space-y-4">
        {items.map((post) => (
          <li key={post.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-slate-100">{post.authorName}</p>
              <time className="text-xs text-slate-500">
                {new Date(post.createdAt).toLocaleString()}
              </time>
            </div>
            {post.title && <h3 className="mt-2 text-lg text-slate-200">{post.title}</h3>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{post.body}</p>
            {post.postType === 'link' && typeof post.extras.url === 'string' && (
              <a
                href={post.extras.url}
                className="mt-2 inline-block text-sm text-sky-400 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {typeof post.extras.hostname === 'string'
                  ? post.extras.hostname
                  : post.extras.url}
              </a>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  #{t}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={async () => {
                  await likePost(post.id);
                  await reload();
                }}
                className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800"
              >
                Like ({post.reactionCounts.like})
              </button>
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800"
              >
                Comments ({post.reactionCounts.comment})
              </button>
            </div>
            {expanded === post.id && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <ul className="space-y-2 text-sm">
                  {(comments[post.id] ?? []).map((c) => (
                    <li key={c.id} className="text-slate-300">
                      <span className="font-medium text-slate-200">{c.authorName}</span>
                      <span className="text-slate-500"> · </span>
                      {c.body}
                    </li>
                  ))}
                  {!comments[post.id]?.length && (
                    <li className="text-slate-500">No comments yet</li>
                  )}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    value={commentDraft[post.id] ?? ''}
                    onChange={(e) =>
                      setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a comment…"
                  />
                  <button
                    type="button"
                    disabled={!commentDraft[post.id]?.trim()}
                    onClick={async () => {
                      const body = commentDraft[post.id]?.trim();
                      if (!body) return;
                      await addComment(post.id, body);
                      setCommentDraft((prev) => ({ ...prev, [post.id]: '' }));
                      const data = await fetchComments(post.id);
                      setComments((prev) => ({ ...prev, [post.id]: data.items }));
                      await reload();
                    }}
                    className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600 disabled:opacity-40"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
