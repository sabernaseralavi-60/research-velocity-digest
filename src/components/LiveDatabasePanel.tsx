import React, { useState } from 'react';
import { Database, Clock, Plus, Trash2, Lock } from 'lucide-react';
import { DbDigest, DbStatus, DbTopic, addDbTopic, removeDbTopic } from '../services/dbApi.ts';

interface Props {
  status: DbStatus;
  topics: DbTopic[];
  topicId: string;
  setTopicId: (id: string) => void;
  windowDays: number;
  setWindowDays: (d: number) => void;
  digest: DbDigest | null;
  digestError: string | null;
  onTopicsChanged: () => void;
}

function Growth({ points }: { points: Array<{ date: string; papers: number }> }) {
  if (points.length === 0) return <span className="text-slate-500 text-xs">no ingest yet</span>;
  const max = Math.max(...points.map((p) => p.papers), 1);
  return (
    <svg role="img" aria-label={`Papers added per day, last ${points.length} days`} viewBox="0 0 240 28" className="h-7 w-[240px]">
      {points.map((p, i) => {
        const h = Math.max(1, (p.papers / max) * 26);
        return (
          <rect key={p.date} x={240 - (points.length - i) * 8 + 1} y={28 - h} width={6} height={h} rx={1} className="fill-blue-500/70">
            <title>{`${p.date}: ${p.papers} papers`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export const LiveDatabasePanel: React.FC<Props> = ({ status, topics, topicId, setTopicId, windowDays, setWindowDays, digest, digestError, onTopicsChanged }) => {
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const note = await addDbTopic(token, label, query);
      setMessage({ ok: true, text: `Topic saved: ${note}.` });
      setLabel('');
      setQuery('');
      onTopicsChanged();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await removeDbTopic(token, id);
      onTopicsChanged();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const lastRun = status.last_runs[0];

  return (
    <section aria-label="Live citation database" className="mb-6 rounded-2xl border border-blue-500/30 bg-slate-900 p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">Live citation database</h3>
            <p className="text-xs text-slate-400">
              A scheduled job reads new OpenAlex papers every day and stores their reference lists. Everything below is computed from that database.
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              {digest ? `indices computed ${digest.computed_at.replace('T', ' ').replace('Z', ' UTC')}` : 'indices not computed yet for this topic'}
              {lastRun ? ` · last ingest ${lastRun.status} (${lastRun.papers_new} new papers)` : ''}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-4 gap-3 text-center">
          {([['papers', status.totals.papers], ['references', status.totals.edges], ['works', status.totals.works], ['topics', status.totals.topics]] as const).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <dd className="font-mono text-sm font-extrabold text-white">{v.toLocaleString('en-US')}</dd>
              <dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-slate-800 pt-4">
        <label className="text-xs text-slate-300">
          <span className="mb-1 block font-semibold">Topic</span>
          <select
            aria-label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            {topics.map((t) => (
              <option key={t.topic_id} value={t.topic_id}>{t.label}</option>
            ))}
          </select>
        </label>
        <div className="text-xs text-slate-300">
          <span className="mb-1 block font-semibold">Window</span>
          <div className="flex gap-1.5" role="group" aria-label="Lookback window">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setWindowDays(d)}
                aria-pressed={windowDays === d}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${windowDays === d ? 'border-blue-500/50 bg-blue-600/30 text-blue-200' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'}`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-300">
          <span className="mb-1 block font-semibold">Database growth (papers/day)</span>
          <Growth points={status.growth} />
        </div>
      </div>

      {digestError && (
        <p role="status" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {digestError}
        </p>
      )}
      {digest && digest.stats.earliest_paper_date && Date.parse(digest.stats.earliest_paper_date) - Date.parse(digest.since) > 2 * 86400000 && (
        <p role="status" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          The database holds papers of this topic only from {digest.stats.earliest_paper_date} on ({digest.stats.days_with_papers} days), so this {digest.window_days}-day window is not fully covered yet. It fills up with every daily run.
        </p>
      )}
      {digest && digest.topic.kind === 'concepts' && (
        <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          Broad topic: up to 300 papers per day are sampled (it has far more), so counts describe the sample, not every paper.
        </p>
      )}
      {digest?.stats.threshold_fallback && (
        <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          Fewer than 3 works reached the usual cut-off of {digest.stats.trending_threshold} citing papers in this small topic, so works cited by at least 2 recent papers are listed instead.
        </p>
      )}

      <details className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold">
          <Lock className="h-3.5 w-3.5 text-slate-400" /> Manage monitored topics (needs the admin token)
        </summary>
        {!status.editing_enabled && <p className="mt-2 text-slate-500">Editing is switched off on this server (no admin token configured).</p>}
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-4">
          <input aria-label="Admin token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" required className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white" />
          <input aria-label="Topic label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Mode choice" required minLength={3} maxLength={80} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white" />
          <input aria-label="Search query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={'Query, e.g. "mode choice" OR "route choice"'} maxLength={200} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white" />
          <button disabled={busy} className="inline-flex items-center justify-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" /> Add topic
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">New topics are ingested with a 30-day backfill by the next daily run. The query uses OpenAlex title-and-abstract search (quotes and OR/AND work).</p>
        {message && <p role="status" className={`mt-2 ${message.ok ? 'text-emerald-300' : 'text-red-300'}`}>{message.text}</p>}
        <ul className="mt-3 divide-y divide-slate-800">
          {topics.map((t) => (
            <li key={t.topic_id} className="flex items-center justify-between gap-3 py-1.5">
              <span><span className="font-semibold text-white">{t.label}</span> <span className="text-slate-500">· {t.kind === 'concepts' ? 'broad AI/ML/CV concepts' : t.query}</span></span>
              {t.topic_id !== 'ai-research' && (
                <button onClick={() => remove(t.topic_id)} disabled={busy || !token} aria-label={`Remove ${t.label}`} className="rounded p-1 text-slate-400 hover:text-red-300 disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
};
