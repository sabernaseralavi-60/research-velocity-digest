/**
 * Read API for the dashboard (one Vercel function; local dev uses the same handler through server/dev.ts).
 *
 *   GET  /api/status                         totals, growth curve, last runs
 *   GET  /api/topics                         active topics
 *   GET  /api/digest?topic=<id>&window=7|30  precomputed indices of a topic (written by the daily job)
 *   POST /api/topics   {label, query}        add a topic - needs `Authorization: Bearer $ADMIN_TOKEN`
 *   DELETE /api/topics?id=<id>               deactivate a topic - same token
 *
 * Reads are public (published papers only, no personal data). Every write is authorised on the server.
 * Database: DATABASE_URL = Postgres (Neon). Without it a local SQLite file is used (development only).
 */
import { timingSafeEqual } from 'node:crypto';

export interface ApiRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): unknown;
  send(body: string): unknown;
}

type Row = Record<string, unknown>;
export interface Db {
  query(sql: string, params?: unknown[]): Promise<Row[]>;
}

const WINDOWS = [7, 30];
const MAX_ACTIVE_TOPICS = 20;
let cached: Db | null = null;

export async function openDb(): Promise<Db> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL || '';
  if (/^postgres(ql)?:\/\//.test(url)) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    cached = {
      async query(text, params = []) {
        let i = 0;
        const pgText = text.replace(/\?/g, () => `$${++i}`);
        return (await sql.query(pgText, params as unknown[])) as Row[];
      },
    };
  } else {
    // local app and tests: Node built-in SQLite (never used on Vercel, where DATABASE_URL is set)
    const specifier = 'node:sqlite';
    const { DatabaseSync } = (await import(specifier)) as typeof import('node:sqlite');
    const file = url || process.env.SQLITE_PATH || 'output/research_velocity.db';
    // One short-lived connection per query: the daily snapshot download replaces the file while the
    // local server keeps running, and Windows cannot replace a file that an open connection holds.
    cached = {
      async query(text, params = []) {
        const db = new DatabaseSync(file);
        try {
          const stmt = db.prepare(text);
          if (/^\s*select/i.test(text)) return stmt.all(...(params as never[])) as Row[];
          stmt.run(...(params as never[]));
          return [];
        } finally {
          db.close();
        }
      },
    };
  }
  return cached;
}

export function setDbForTests(db: Db | null): void {
  cached = db;
}

function send(res: ApiResponse, code: number, body: unknown, cache = 'no-store'): void {
  res.status(code);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.send(JSON.stringify(body));
}

function slugify(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (slug || 'topic').slice(0, 60);
}

export function isAuthorised(req: ApiRequest, token = process.env.ADMIN_TOKEN || ''): boolean {
  if (!token) return false;
  const header = req.headers['authorization'];
  const value = Array.isArray(header) ? header[0] : header || '';
  const given = value.startsWith('Bearer ') ? value.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// best-effort per-instance limiter for the only write route (serverless instances do not share memory)
const attempts = new Map<string, { n: number; reset: number }>();
export function tooManyAttempts(key: string, now = Date.now(), limit = 20, windowMs = 60_000): boolean {
  const cur = attempts.get(key);
  if (!cur || cur.reset < now) {
    attempts.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  cur.n += 1;
  return cur.n > limit;
}

function clientKey(req: ApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const v = Array.isArray(fwd) ? fwd[0] : fwd || 'local';
  return v.split(',')[0].trim();
}

export function validateTopic(body: unknown): { label: string; query: string } | string {
  const b = (body ?? {}) as Row;
  const label = typeof b.label === 'string' ? b.label.trim() : '';
  const query = typeof b.query === 'string' && b.query.trim() ? b.query.trim() : label;
  if (label.length < 3 || label.length > 80) return 'label must be 3-80 characters';
  if (query.length < 3 || query.length > 200) return 'query must be 3-200 characters';
  if (/[\u0000-\u001f<>{}\\]/.test(label + query)) return 'label/query contain characters that are not allowed';
  return { label, query };
}

function parseJson(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const route = url.pathname.replace(/\/+$/, '');
    const method = (req.method || 'GET').toUpperCase();
    const db = await openDb();

    if (route === '/api/status' && method === 'GET') {
      const one = async (sql: string) => Number((await db.query(sql))[0]?.n ?? 0);
      const totals = {
        papers: await one('SELECT COUNT(*) AS n FROM papers'),
        edges: await one('SELECT COUNT(*) AS n FROM edges'),
        works: await one('SELECT COUNT(*) AS n FROM works'),
        topics: await one('SELECT COUNT(*) AS n FROM topics WHERE is_active = 1'),
      };
      const growthDesc = await db.query(
        'SELECT SUBSTR(first_seen, 1, 10) AS d, COUNT(*) AS n FROM papers GROUP BY SUBSTR(first_seen, 1, 10) ORDER BY d DESC LIMIT 30',
      );
      const runs = await db.query(
        'SELECT topic_id, started_at, finished_at, status, papers_seen, papers_new, edges_new, truncated FROM runs ORDER BY started_at DESC LIMIT 10',
      );
      return send(res, 200, {
        totals,
        growth: growthDesc.reverse().map((r) => ({ date: String(r.d), papers: Number(r.n) })),
        last_runs: runs,
        editing_enabled: Boolean(process.env.ADMIN_TOKEN),
      }, 'public, s-maxage=300');
    }

    if (route === '/api/topics' && method === 'GET') {
      const topics = await db.query(
        'SELECT topic_id, label, query, kind FROM topics WHERE is_active = 1 ORDER BY created_at, topic_id',
      );
      return send(res, 200, { topics }, 'public, s-maxage=300');
    }

    if (route === '/api/digest' && method === 'GET') {
      const topic = url.searchParams.get('topic') || '';
      const window = Number(url.searchParams.get('window') || 7);
      if (!/^[a-z0-9-]{1,60}$/.test(topic)) return send(res, 400, { error: 'invalid topic id' });
      if (!WINDOWS.includes(window)) return send(res, 400, { error: `window must be one of ${WINDOWS.join(', ')}` });
      const rows = await db.query(
        'SELECT computed_at, payload FROM snapshots WHERE kind = ? AND topic_id = ? AND window_days = ?',
        ['insights', topic, window],
      );
      if (rows.length === 0) {
        return send(res, 404, { error: 'no snapshot yet for this topic: it is computed by the next daily run' });
      }
      const payload = JSON.parse(String(rows[0].payload));
      return send(res, 200, { ...payload, computed_at: String(rows[0].computed_at) }, 'public, s-maxage=300');
    }

    if (route === '/api/topics' && (method === 'POST' || method === 'DELETE')) {
      if (tooManyAttempts(clientKey(req))) return send(res, 429, { error: 'too many requests' });
      if (!process.env.ADMIN_TOKEN) return send(res, 503, { error: 'topic editing is disabled (ADMIN_TOKEN not set)' });
      if (!isAuthorised(req)) return send(res, 401, { error: 'missing or wrong admin token' });

      if (method === 'POST') {
        const checked = validateTopic(parseJson(req.body));
        if (typeof checked === 'string') return send(res, 400, { error: checked });
        const active = Number((await db.query('SELECT COUNT(*) AS n FROM topics WHERE is_active = 1'))[0]?.n ?? 0);
        if (active >= MAX_ACTIVE_TOPICS) return send(res, 409, { error: `at most ${MAX_ACTIVE_TOPICS} active topics` });
        const id = slugify(checked.label);
        await db.query(
          `INSERT INTO topics (topic_id, label, query, kind, hydrate_all, is_active, created_at)
           VALUES (?, ?, ?, 'search', 1, 1, ?)
           ON CONFLICT (topic_id) DO UPDATE SET label = excluded.label, query = excluded.query, is_active = 1`,
          [id, checked.label, checked.query, new Date().toISOString().replace(/\.\d+Z$/, 'Z')],
        );
        return send(res, 201, { topic_id: id, note: 'ingested with a 30-day backfill by the next daily run' });
      }

      const id = url.searchParams.get('id') || '';
      if (!/^[a-z0-9-]{1,60}$/.test(id)) return send(res, 400, { error: 'invalid topic id' });
      if (id === 'ai-research') return send(res, 409, { error: 'the broad default topic cannot be removed' });
      await db.query('UPDATE topics SET is_active = 0 WHERE topic_id = ?', [id]);
      return send(res, 200, { topic_id: id, is_active: false });
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error('api error', err instanceof Error ? err.message : err);
    return send(res, 500, { error: 'internal error' });
  }
}
