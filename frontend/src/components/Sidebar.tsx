import type { SummaryResponse } from '@/lib/api';
import { Avatar } from './Avatar';
import { TrendingIcon } from './icons';

type Props = {
  summary: SummaryResponse | null;
  activeTag: string;
  onTagClick: (tag: string) => void;
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-zinc-900/50 p-5">
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Sidebar({ summary, activeTag, onTagClick }: Props) {
  const topTags = summary?.topTags.slice(0, 6) ?? [];
  const maxCount = Math.max(1, ...topTags.map((t) => t.count));

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-violet-600/20 via-zinc-900/60 to-zinc-900/60 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">Last 24 hours</p>
        <p className="mt-2 text-4xl font-bold tabular-nums text-white">{summary?.totalPosts ?? '—'}</p>
        <p className="mt-1 text-sm text-zinc-400">new posts across the community</p>
        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-violet-500/20 blur-2xl" />
      </section>

      <Card title="Trending tags">
        {topTags.length ? (
          <ul className="space-y-1">
            {topTags.map((row, i) => (
              <li key={row.tag}>
                <button
                  type="button"
                  onClick={() => onTagClick(row.tag)}
                  className={`group w-full rounded-xl px-3 py-2 text-left transition ${
                    activeTag === row.tag ? 'bg-violet-500/15' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-4 text-xs tabular-nums text-zinc-600">{i + 1}</span>
                      <span className={activeTag === row.tag ? 'text-violet-300' : 'text-zinc-200'}>
                        #{row.tag}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">{row.count} posts</span>
                  </div>
                  <div className="ml-6 mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${(row.count / maxCount) * 100}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <TrendingIcon width={16} height={16} /> Nothing trending yet
          </p>
        )}
      </Card>

      {!!summary?.topAuthors.length && (
        <Card title="Top contributors">
          <ul className="space-y-3">
            {summary.topAuthors.slice(0, 5).map((a) => (
              <li key={a.authorId} className="flex items-center gap-3">
                <Avatar id={a.authorId} name={a.authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{a.authorName}</p>
                  <p className="truncate text-xs text-zinc-500">@{a.authorId.replace(/^u-/, '')}</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-400">
                  {a.count}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-2 text-xs leading-relaxed text-zinc-600">
        Pulse Feed · MongoDB UGC demo paired with FlashSale. Built with Next.js, Express, and Mongoose.
      </p>
    </div>
  );
}
