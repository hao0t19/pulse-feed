'use client';

import { useState } from 'react';
import type { CommentItem, PostItem } from '@/lib/api';
import { addComment, fetchComments } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { Avatar } from './Avatar';
import { CommentIcon, HeartIcon, LinkIcon, SendIcon, SpinnerIcon } from './icons';

type Props = {
  post: PostItem;
  liked: boolean;
  activeTag: string;
  onLike: (post: PostItem) => void;
  onTagClick: (tag: string) => void;
  onCommentAdded: (postId: string) => void;
};

export function PostCard({ post, liked, activeTag, onLike, onTagClick, onCommentAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const link =
    post.postType === 'link' && typeof post.extras.url === 'string' ? post.extras.url : null;
  const hostname =
    typeof post.extras.hostname === 'string' ? post.extras.hostname : link ?? undefined;

  const toggleComments = async () => {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        setComments((await fetchComments(post.id)).items);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await addComment(post.id, body);
      setDraft('');
      setComments((await fetchComments(post.id)).items);
      onCommentAdded(post.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition hover:border-white/10 hover:bg-zinc-900/70 sm:p-5">
      <header className="flex items-start gap-3">
        <Avatar id={post.authorId} name={post.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate font-semibold text-zinc-100">{post.authorName}</span>
            <span className="truncate text-sm text-zinc-500">@{post.authorId.replace(/^u-/, '')}</span>
            <span className="text-zinc-600" aria-hidden>
              ·
            </span>
            <time
              dateTime={post.createdAt}
              title={new Date(post.createdAt).toLocaleString()}
              className="text-sm text-zinc-500"
            >
              {timeAgo(post.createdAt)}
            </time>
          </div>

          {post.title && (
            <h2 className="mt-1.5 text-base font-semibold leading-snug text-zinc-50 sm:text-lg">
              {post.title}
            </h2>
          )}
          <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-300">
            {post.body}
          </p>

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-950/60 p-3 transition hover:border-violet-500/30 hover:bg-zinc-950"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                <LinkIcon width={16} height={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-200">{hostname}</span>
                <span className="block truncate text-xs text-zinc-500">{link}</span>
              </span>
            </a>
          )}

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagClick(t)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    activeTag === t
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          <footer className="-ml-2 mt-3 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLike(post)}
              aria-pressed={liked}
              aria-label={liked ? 'Liked' : 'Like'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition active:scale-95 ${
                liked
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : 'text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400'
              }`}
            >
              <HeartIcon filled={liked} width={18} height={18} />
              <span className="tabular-nums">{post.reactionCounts.like}</span>
            </button>
            <button
              type="button"
              onClick={toggleComments}
              aria-expanded={open}
              aria-label="Comments"
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition active:scale-95 ${
                open
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-zinc-400 hover:bg-sky-500/10 hover:text-sky-400'
              }`}
            >
              <CommentIcon width={18} height={18} />
              <span className="tabular-nums">{post.reactionCounts.comment}</span>
            </button>
          </footer>
        </div>
      </header>

      {open && (
        <div className="mt-3 border-t border-white/5 pt-3 sm:ml-[3.25rem]">
          {loadingComments ? (
            <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
              <SpinnerIcon width={16} height={16} /> Loading comments…
            </div>
          ) : (
            <ul className="space-y-3">
              {(comments ?? []).map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar id={c.authorId} name={c.authorName} size="sm" />
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-zinc-800/50 px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-zinc-200">{c.authorName}</span>
                      <time dateTime={c.createdAt} className="text-xs text-zinc-500">
                        {timeAgo(c.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-zinc-300">{c.body}</p>
                  </div>
                </li>
              ))}
              {comments?.length === 0 && (
                <li className="py-1 text-sm text-zinc-500">No comments yet. Start the thread.</li>
              )}
            </ul>
          )}

          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor={`comment-${post.id}`} className="sr-only">
              Write a comment
            </label>
            <input
              id={`comment-${post.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              placeholder="Write a reply…"
              className="h-10 min-w-0 flex-1 rounded-full border border-white/5 bg-zinc-950/60 px-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send reply"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 active:scale-95 disabled:opacity-40"
            >
              {sending ? <SpinnerIcon width={16} height={16} /> : <SendIcon width={16} height={16} />}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-zinc-900/50 p-4 sm:p-5">
      <div className="flex gap-3">
        <div className="size-10 rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3 w-1/3 rounded bg-zinc-800" />
          <div className="h-3 w-full rounded bg-zinc-800" />
          <div className="h-3 w-4/5 rounded bg-zinc-800" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-14 rounded-full bg-zinc-800" />
            <div className="h-5 w-16 rounded-full bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
