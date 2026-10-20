'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostItem, SummaryResponse } from '@/lib/api';
import { DEMO_USER, fetchPosts, fetchSummary, likePost } from '@/lib/api';
import { normalizeTag } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { Composer, type ComposerHandle } from '@/components/Composer';
import { PostCard, PostSkeleton } from '@/components/PostCard';
import { Sidebar } from '@/components/Sidebar';
import { CloseIcon, PlusIcon, PulseIcon, SearchIcon, SpinnerIcon } from '@/components/icons';

const PAGE_SIZE = '20';
const LIKED_KEY = 'pulse-feed:liked';

export default function HomePage() {
  const [tagInput, setTagInput] = useState('');
  const [tag, setTag] = useState('');
  const [items, setItems] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const composerRef = useRef<ComposerHandle>(null);
  const requestId = useRef(0);

  useEffect(() => {
    try {
      setLiked(new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]')));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setTag(normalizeTag(tagInput)), 300);
    return () => clearTimeout(id);
  }, [tagInput]);

  const loadFeed = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: PAGE_SIZE };
      if (tag) params.tag = tag;
      const page = await fetchPosts(params);
      if (current !== requestId.current) return;
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      if (current === requestId.current) setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [tag]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchSummary());
    } catch {
      /* summary is non-critical */
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params: Record<string, string> = { limit: PAGE_SIZE, cursor: nextCursor };
      if (tag) params.tag = tag;
      const page = await fetchPosts(params);
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      setLoadingMore(false);
    }
  };

  const selectTag = (t: string) => {
    const next = tag === t ? '' : t;
    setTagInput(next);
    setTag(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistLiked = (next: Set<string>) => {
    setLiked(next);
    localStorage.setItem(LIKED_KEY, JSON.stringify([...next]));
  };

  const bumpCount = (postId: string, key: 'like' | 'comment', delta: number) =>
    setItems((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reactionCounts: { ...p.reactionCounts, [key]: p.reactionCounts[key] + delta } }
          : p,
      ),
    );

  const handleLike = async (post: PostItem) => {
    if (liked.has(post.id)) return;
    persistLiked(new Set(liked).add(post.id));
    bumpCount(post.id, 'like', 1);
    try {
      const result = await likePost(post.id);
      if (result.status === 'already-liked') {
        bumpCount(post.id, 'like', -1);
      } else {
        setItems((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, reactionCounts: result.reactionCounts } : p)),
        );
      }
    } catch {
      bumpCount(post.id, 'like', -1);
      const reverted = new Set(liked);
      reverted.delete(post.id);
      persistLiked(reverted);
    }
  };

  const topTags = summary?.topTags.slice(0, 8) ?? [];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Pulse Feed home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
              <PulseIcon width={18} height={18} />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">Pulse</span>
          </a>

          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <SearchIcon
              width={16}
              height={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <label htmlFor="tag-search" className="sr-only">
              Filter by tag
            </label>
            <input
              id="tag-search"
              type="search"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Filter by #tag"
              autoComplete="off"
              className="h-10 w-full rounded-full border border-white/5 bg-zinc-900/80 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {tagInput && (
              <button
                type="button"
                onClick={() => selectTag('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <CloseIcon width={14} height={14} />
              </button>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden text-right text-sm leading-tight md:block">
              <span className="block font-medium text-zinc-200">{DEMO_USER.name}</span>
              <span className="block text-xs text-zinc-500">@{DEMO_USER.id.replace(/^u-/, '')}</span>
            </span>
            <Avatar id={DEMO_USER.id} name={DEMO_USER.name} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:pb-12">
        <main className="min-w-0 space-y-4">
          <div className="lg:hidden">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                <span className="tabular-nums">{summary?.totalPosts ?? '—'}</span> posts today
              </span>
              {topTags.map((row) => (
                <button
                  key={row.tag}
                  type="button"
                  onClick={() => selectTag(row.tag)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    tag === row.tag
                      ? 'bg-violet-500 text-white'
                      : 'border border-white/5 bg-zinc-900/80 text-zinc-300 active:bg-zinc-800'
                  }`}
                >
                  #{row.tag}
                  <span className={tag === row.tag ? 'ml-1 text-violet-200' : 'ml-1 text-zinc-500'}>
                    {row.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Composer
            ref={composerRef}
            onPosted={() => {
              loadFeed();
              loadSummary();
            }}
          />

          <div className="flex items-center justify-between px-1 pt-2">
            <h1 className="text-sm font-semibold text-zinc-300">
              {tag ? (
                <>
                  Posts tagged <span className="text-violet-300">#{tag}</span>
                </>
              ) : (
                'Latest posts'
              )}
            </h1>
            {tag && (
              <button
                type="button"
                onClick={() => selectTag('')}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              >
                <CloseIcon width={12} height={12} /> Clear
              </button>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              <span>Couldn&apos;t load the feed ({error}).</span>
              <button
                type="button"
                onClick={loadFeed}
                className="shrink-0 rounded-full bg-rose-500/20 px-3 py-1 font-medium hover:bg-rose-500/30"
              >
                Retry
              </button>
            </div>
          )}

          <div className="space-y-3" aria-busy={loading}>
            {loading && items.length === 0
              ? Array.from({ length: 3 }, (_, i) => <PostSkeleton key={i} />)
              : items.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    liked={liked.has(post.id)}
                    activeTag={tag}
                    onLike={handleLike}
                    onTagClick={selectTag}
                    onCommentAdded={(id) => {
                      bumpCount(id, 'comment', 1);
                      loadSummary();
                    }}
                  />
                ))}
          </div>

          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
              <p className="font-medium text-zinc-300">
                {tag ? `No posts tagged #${tag} yet` : 'The feed is quiet'}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Be the first to share something.</p>
              <button
                type="button"
                onClick={() => composerRef.current?.focus()}
                className="mt-4 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                Write a post
              </button>
            </div>
          )}

          {nextCursor && !loading && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/50 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-60"
            >
              {loadingMore && <SpinnerIcon width={16} height={16} />}
              Load more
            </button>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Sidebar summary={summary} activeTag={tag} onTagClick={selectTag} />
          </div>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => composerRef.current?.focus()}
        aria-label="New post"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/30 transition active:scale-95 lg:hidden"
      >
        <PlusIcon width={24} height={24} />
      </button>
    </>
  );
}
