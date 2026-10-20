'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { createPost, DEMO_USER } from '@/lib/api';
import { parseTags } from '@/lib/format';
import { Avatar } from './Avatar';
import { SpinnerIcon } from './icons';

const MAX_BODY = 8000;

export type ComposerHandle = { focus: () => void };

export const Composer = forwardRef<ComposerHandle, { onPosted: () => void }>(function Composer(
  { onPosted },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('engineering');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current?.focus({ preventScroll: true });
    },
  }));

  const tags = parseTags(tagInput);
  const canPost = body.trim().length > 0 && body.length <= MAX_BODY && !posting;

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const submit = async () => {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      await createPost({ body: body.trim(), tags });
      setBody('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish');
    } finally {
      setPosting(false);
    }
  };

  return (
    <section
      aria-label="Create post"
      className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4 shadow-lg shadow-black/20 backdrop-blur sm:p-5"
    >
      <div className="flex gap-3">
        <Avatar id={DEMO_USER.id} name={DEMO_USER.name} />
        <div className="min-w-0 flex-1">
          <label htmlFor="composer-body" className="sr-only">
            Post body
          </label>
          <textarea
            id="composer-body"
            ref={textareaRef}
            rows={2}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              autoGrow(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="What's happening on the platform?"
            className="w-full resize-none bg-transparent pt-2 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300"
              >
                #{t}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-white/5 pt-3 sm:flex-row sm:items-center">
            <label htmlFor="composer-tags" className="sr-only">
              Tags
            </label>
            <input
              id="composer-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags: flashsale, ops"
              className="h-10 min-w-0 flex-1 rounded-xl border border-white/5 bg-zinc-950/60 px-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span
                className={`text-xs tabular-nums ${body.length > MAX_BODY ? 'text-rose-400' : 'text-zinc-500'}`}
              >
                {body.length > MAX_BODY - 500 ? `${body.length}/${MAX_BODY}` : ''}
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!canPost}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {posting && <SpinnerIcon width={16} height={16} />}
                Publish
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
          <p className="mt-2 hidden text-xs text-zinc-600 sm:block">Ctrl + Enter to publish</p>
        </div>
      </div>
    </section>
  );
});
