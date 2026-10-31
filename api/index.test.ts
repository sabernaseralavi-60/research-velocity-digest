import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import handler, { ApiRequest, ApiResponse, Db, isAuthorised, setDbForTests, tooManyAttempts, validateTopic } from './index.ts';

const SCHEMA = `
CREATE TABLE topics (topic_id TEXT PRIMARY KEY, label TEXT NOT NULL, query TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'search',
  hydrate_all INTEGER NOT NULL DEFAULT 1, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE papers (work_id TEXT PRIMARY KEY, title TEXT, publication_date TEXT, publication_year INTEGER, primary_topic TEXT, doi TEXT, first_seen TEXT NOT NULL);
CREATE TABLE edges (source_id TEXT NOT NULL, target_id TEXT NOT NULL, edge_date TEXT NOT NULL, PRIMARY KEY (source_id, target_id));
CREATE TABLE works (work_id TEXT PRIMARY KEY, title TEXT, publication_year INTEGER, cited_by_count INTEGER, authors TEXT, abstract TEXT, doi TEXT, primary_topic TEXT, subfield TEXT, fetched_at TEXT NOT NULL);
CREATE TABLE snapshots (kind TEXT NOT NULL, topic_id TEXT NOT NULL, window_days INTEGER NOT NULL, computed_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (kind, topic_id, window_days));
CREATE TABLE runs (run_id TEXT PRIMARY KEY, topic_id TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL, papers_seen INTEGER DEFAULT 0, papers_new INTEGER DEFAULT 0, edges_new INTEGER DEFAULT 0, truncated INTEGER DEFAULT 0, error TEXT);
INSERT INTO topics VALUES ('ai-research', 'AI broad', 'ai', 'concepts', 0, 1, '2026-10-01T00:00:00Z');
INSERT INTO topics VALUES ('ssm', 'Surrogate safety', 'surrogate safety', 'search', 1, 1, '2026-10-02T00:00:00Z');
INSERT INTO papers VALUES ('W1', 't', '2026-10-30', 2026, 'x', NULL, '2026-10-31T01:00:00Z');
INSERT INTO papers VALUES ('W2', 't', '2026-10-30', 2026, 'x', NULL, '2026-10-31T01:00:00Z');
INSERT INTO snapshots VALUES ('insights', 'ssm', 7, '2026-10-31T04:40:00Z', '{"window_days":7,"trending":[{"id":"R1"}],"stats":{}}');
`;

function freshDb(): Db {
  const raw = new DatabaseSync(':memory:');
  raw.exec(SCHEMA);
  return {
    async query(sql, params = []) {
      const stmt = raw.prepare(sql);
      if (/^\s*select/i.test(sql)) return stmt.all(...(params as never[])) as Record<string, unknown>[];
      stmt.run(...(params as never[]));
      return [];
    },
  };
}

async function call(method: string, url: string, opts: { token?: string; body?: unknown } = {}) {
  let code = 0;
  let text = '';
  const headers: Record<string, string> = {};
  const res: ApiResponse = {
    status(c) { code = c; return res; },
    setHeader(n, v) { headers[n.toLowerCase()] = v; },
    send(b) { text = b; },
  };
  const req: ApiRequest = {
    method, url,
    headers: opts.token ? { authorization: `Bearer ${opts.token}`, 'x-forwarded-for': 'test-' + Math.random() } : { 'x-forwarded-for': 'test-' + Math.random() },
    body: opts.body,
  };
  await handler(req, res);
  return { code, json: JSON.parse(text), headers };
}

test.beforeEach(() => {
  setDbForTests(freshDb());
  process.env.ADMIN_TOKEN = 'secret-token-123';
});

test('status reports totals and growth', async () => {
  const r = await call('GET', '/api/status');
  assert.equal(r.code, 200);
  assert.deepEqual(r.json.totals, { papers: 2, edges: 0, works: 0, topics: 2 });
  assert.deepEqual(r.json.growth, [{ date: '2026-10-31', papers: 2 }]);
  assert.equal(r.json.editing_enabled, true);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
});

test('digest returns the stored snapshot and validates input', async () => {
  const ok = await call('GET', '/api/digest?topic=ssm&window=7');
  assert.equal(ok.code, 200);
  assert.equal(ok.json.trending[0].id, 'R1');
  assert.equal(ok.json.computed_at, '2026-10-31T04:40:00Z');
  assert.equal((await call('GET', '/api/digest?topic=ssm&window=30')).code, 404); // not computed yet: explicit, not fake
  assert.equal((await call('GET', '/api/digest?topic=ssm&window=9')).code, 400);
  assert.equal((await call('GET', "/api/digest?topic=x';DROP TABLE topics;--&window=7")).code, 400);
});

test('topics: list is public, writes need the admin token', async () => {
  const list = await call('GET', '/api/topics');
  assert.deepEqual(list.json.topics.map((t: { topic_id: string }) => t.topic_id), ['ai-research', 'ssm']);
  assert.equal((await call('POST', '/api/topics', { body: { label: 'Road safety' } })).code, 401);
  assert.equal((await call('POST', '/api/topics', { token: 'wrong', body: { label: 'Road safety' } })).code, 401);
  const created = await call('POST', '/api/topics', { token: 'secret-token-123', body: { label: 'Road Safety Audit', query: '"road safety audit"' } });
  assert.equal(created.code, 201);
  assert.equal(created.json.topic_id, 'road-safety-audit');
  assert.equal((await call('GET', '/api/topics')).json.topics.length, 3);
  const removed = await call('DELETE', '/api/topics?id=road-safety-audit', { token: 'secret-token-123' });
  assert.equal(removed.code, 200);
  assert.equal((await call('GET', '/api/topics')).json.topics.length, 2);
});

test('writes are refused when no ADMIN_TOKEN is configured and the default topic is protected', async () => {
  delete process.env.ADMIN_TOKEN;
  assert.equal((await call('POST', '/api/topics', { token: 'anything', body: { label: 'Road safety' } })).code, 503);
  process.env.ADMIN_TOKEN = 'secret-token-123';
  assert.equal((await call('DELETE', '/api/topics?id=ai-research', { token: 'secret-token-123' })).code, 409);
});

test('topic validation and sql-injection-shaped input', async () => {
  assert.equal(typeof validateTopic({ label: 'ab' }), 'string');
  assert.equal(typeof validateTopic({ label: 'ok label', query: '<script>' }), 'string');
  assert.deepEqual(validateTopic({ label: '  Travel survey ' }), { label: 'Travel survey', query: 'Travel survey' });
  const r = await call('POST', '/api/topics', { token: 'secret-token-123', body: { label: "x'); DROP TABLE topics;--", query: 'safe query' } });
  assert.equal(r.code, 201); // stored as data through parameters, never executed
  assert.equal((await call('GET', '/api/status')).json.totals.topics, 3);
});

test('auth helper and rate limiter', () => {
  assert.equal(isAuthorised({ headers: { authorization: 'Bearer abc' } }, 'abc'), true);
  assert.equal(isAuthorised({ headers: { authorization: 'Bearer abd' } }, 'abc'), false);
  assert.equal(isAuthorised({ headers: {} }, 'abc'), false);
  assert.equal(isAuthorised({ headers: { authorization: 'Bearer ' } }, ''), false);
  const k = 'limiter-' + Math.random();
  const results = Array.from({ length: 22 }, () => tooManyAttempts(k, 1000, 20, 60_000));
  assert.equal(results.filter(Boolean).length, 2);
  assert.equal(tooManyAttempts(k, 1000 + 61_000, 20, 60_000), false);
});

test('unknown route is 404 json', async () => {
  const r = await call('GET', '/api/nope');
  assert.equal(r.code, 404);
});
