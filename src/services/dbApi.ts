import { LatentGemPaper, PipelineStats, SleepingBeautyPaper, TrendingPaper } from '../types/index.ts';

export interface DbTopic {
  topic_id: string;
  label: string;
  query: string;
  kind: string;
}

export interface DbStatus {
  totals: { papers: number; edges: number; works: number; topics: number };
  growth: Array<{ date: string; papers: number }>;
  last_runs: Array<{ topic_id: string; started_at: string; finished_at: string | null; status: string; papers_seen: number; papers_new: number; edges_new: number; truncated: number }>;
  editing_enabled: boolean;
}

export interface DbDigest {
  topic: DbTopic;
  window_days: number;
  since: string;
  computed_at: string;
  stats: {
    recent_papers_scanned: number;
    total_references_extracted: number;
    unique_works_cited: number;
    trending_threshold: number;
    trending_found_count: number;
    threshold_fallback: boolean;
    earliest_paper_date?: string | null;
    latest_paper_date?: string | null;
    days_with_papers?: number;
  };
  trending: TrendingPaper[];
  sleeping_beauties: SleepingBeautyPaper[];
  latent_gems: LatentGemPaper[];
  methods: { similarity: string };
}

async function getJson<T>(path: string): Promise<T> {
  const resp = await fetch(path, { headers: { Accept: 'application/json' } });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((body as { error?: string }).error || `HTTP ${resp.status}`);
  return body as T;
}

export const fetchDbStatus = () => getJson<DbStatus>('/api/status');
export const fetchDbTopics = async () => (await getJson<{ topics: DbTopic[] }>('/api/topics')).topics;
export const fetchDbDigest = (topic: string, windowDays: number) =>
  getJson<DbDigest>(`/api/digest?topic=${encodeURIComponent(topic)}&window=${windowDays}`);

export async function addDbTopic(token: string, label: string, query: string): Promise<string> {
  const resp = await fetch('/api/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ label, query }),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((body as { error?: string }).error || `HTTP ${resp.status}`);
  return (body as { note?: string }).note || 'added';
}

export async function removeDbTopic(token: string, id: string): Promise<void> {
  const resp = await fetch(`/api/topics?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${resp.status}`);
  }
}

export function digestToStats(d: DbDigest): PipelineStats {
  return {
    lookbackDays: d.window_days,
    startDate: d.since,
    endDate: d.computed_at.slice(0, 10),
    recentPapersScanned: d.stats.recent_papers_scanned,
    totalReferencesExtracted: d.stats.total_references_extracted,
    uniqueWorksCited: d.stats.unique_works_cited,
    trendingThreshold: d.stats.trending_threshold,
    trendingFoundCount: d.stats.trending_found_count,
    executionTimeMs: 0,
    precomputed: true,
    thresholdFallback: d.stats.threshold_fallback,
  };
}
