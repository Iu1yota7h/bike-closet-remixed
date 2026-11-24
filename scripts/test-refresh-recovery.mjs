import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createFeedClient, retryAfterMs} from './catalog-feed.mjs';
import {runRefresh} from './refresh-catalog.mjs';
import {collect} from '../collect.mjs';

const start = Date.parse('2026-11-24T08:17:00Z');
function clock() {
  let time = start;
  const waits = [];
  return {now: () => time, waits, sleep: async ms => {waits.push(ms); time += ms;}};
}
const response = (status, body = [], headers = {}) => new Response(JSON.stringify(body), {
  status, headers: {'content-type': 'application/json', ...headers},
});
const client = (c, fetchFn, options = {}) => createFeedClient({
  ...c, fetchFn, random: () => 0, onRetry: () => {}, ...options,
});
assert.equal(retryAfterMs('120', start), 120_000);
assert.equal(retryAfterMs('Tue, 24 Nov 2026 08:19:00 GMT', start), 120_000);
assert.equal(retryAfterMs('Tuesday, 24-Nov-26 08:19:00 GMT', start), 120_000);
assert.equal(retryAfterMs('Tue Nov 24 08:19:00 2026', start), 120_000);
for (const value of [null, '', 'later', '-1', '1.5']) assert.equal(retryAfterMs(value, start), 0);
assert.equal(retryAfterMs('Mon, 23 Nov 2026 08:17:00 GMT', start), 0);

// A server-directed cooldown longer than the former one/two-second retries recovers.
for (const header of ['120', 'Tue, 24 Nov 2026 08:19:00 GMT']) {
  const c = clock();
  const requested = [];
  const feed = client(c, async () => {
    requested.push(c.now());
    return requested.length === 1 ? response(429, [], {'retry-after': header}) : response(200, [{id: 1}]);
  });
  assert.deepEqual((await feed.getJSON('https://example.test/feed')).body, [{id: 1}]);
  assert.deepEqual(requested, [start, start + 120_000]);
}

// Transient network and service errors recover; permanent errors and malformed JSON stop.
{
  const c = clock();
  let calls = 0;
  const feed = client(c, async () => {
    calls++;
    if (calls === 1) throw new TypeError('synthetic network loss');
    return response(calls === 2 ? 503 : 200, []);
  });
  await feed.getJSON('https://example.test/feed');
  assert.equal(calls, 3);
  assert.deepEqual(c.waits, [30_000, 60_000]);
}
for (const kind of ['not-found', 'bad-json']) {
  const c = clock();
  let calls = 0;
  const feed = client(c, async () => {
    calls++;
    return kind === 'not-found' ? response(404) : new Response('{', {status: 200});
  });
  await assert.rejects(feed.getJSON('https://example.test/feed'));
  assert.equal(calls, 1);
}

// Never shorten Retry-After to squeeze a retry into the time budget.
{
  const c = clock();
  let calls = 0;
  const feed = client(c, async () => {calls++; return response(429, [], {'retry-after': '3600'});});
  await assert.rejects(feed.getJSON('https://example.test/feed'), error =>
    error.retryable === true && error.retryAt >= start + 3_600_000);
  assert.equal(calls, 1);
  assert.deepEqual(c.waits, []);
}

// Pagination is sequential, paced, and a later-page 429 pauses the whole feed.
{
  const c = clock();
  const requests = [];
  let pageTwoCalls = 0;
  let active = 0;
  let peak = 0;
  const feed = client(c, async url => {
    peak = Math.max(peak, ++active);
    const page = Number(new URL(url).searchParams.get('page'));
    requests.push([page, c.now()]);
    await Promise.resolve();
    active--;
    if (page === 2 && pageTwoCalls++ === 0) return response(429, [], {'retry-after': '90'});
    return response(200, [{id: page}], {'x-wp-total': '3', 'x-wp-totalpages': '3'});
  });
  assert.deepEqual(await feed.readAll('https://example.test/feed?per_page=100'), [{id: 1}, {id: 2}, {id: 3}]);
  assert.equal(peak, 1);
  assert.deepEqual(requests, [[1, start], [2, start + 1000], [2, start + 91_000], [3, start + 92_000]]);
}

// End-to-end synthetic collection: no retailer requests, no repository data changes.
const originalCwd = process.cwd();
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-recovery-test-'));
const product = {
  id: 10, parent: 0, name: 'Synthetic cycling item', type: 'simple', is_in_stock: true,
  permalink: 'https://bikecloset.com/product/synthetic-test/', sku: 'SYNTHETIC',
  prices: {currency_code: 'USD', price: '1000', regular_price: '2000', currency_minor_unit: 2},
};
const oldCatalog = {
  checkedAt: '2026-11-21T16:09:39.915Z',
  rows: [{id: 10, price: 12, stock: true}],
};
const protectedPaths = ['public/catalog.json', 'public/status.json', 'data/history.jsonl', 'data/research-queue.json'];
function resetFixture() {
  fs.mkdirSync('public', {recursive: true});
  fs.mkdirSync('data', {recursive: true});
  fs.writeFileSync('public/catalog.json', JSON.stringify(oldCatalog));
  fs.writeFileSync('public/status.json', JSON.stringify({inventory: {checkedAt: oldCatalog.checkedAt, status: 'success'}}));
  fs.writeFileSync('data/history.jsonl', '');
  fs.writeFileSync('data/research-queue.json', JSON.stringify({completed: [], pending: []}));
}
const snapshot = () => protectedPaths.map(file => fs.readFileSync(file, 'utf8'));
try {
  process.chdir(fixture);
  resetFixture();
  const before = snapshot();
  const c = clock();
  let requests = 0;
  let exports = 0;
  const receipts = [];
  const result = await runRefresh({
    ...c, collectFn: collect, exportFn: async () => {exports++;},
    record: receipt => receipts.push(structuredClone(receipt)),
    makeClient: options => client(c, async () => {
      requests++;
      if (requests <= 6) return response(429);
      return response(200, [requests === 7 ? {...product, id: 1, type: 'variable'} : {...product, parent: 1, type: 'variation'}], {'x-wp-total': '1', 'x-wp-totalpages': '1'});
    }, options),
  });
  assert.equal(result.status, 'success');
  assert.equal(result.attempts.length, 2);
  assert.equal(exports, 1);
  assert.equal(requests, 8); // Six throttled requests, then complete products and variants.
  assert.deepEqual(receipts[1].attempts.map(a => a.status), ['running']);
  const records = fs.readFileSync('data/history.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 1);
  assert.equal(records[0].event, 'price-drop');
  assert.equal(records[0].previousPrice, 12);
  assert.equal(records[0].price, 10);
  assert.equal(records[0].at, result.checkedAt);
  assert.equal(result.checkedAt, new Date(c.now()).toISOString());
  assert.notEqual(result.checkedAt.slice(0, 10), '2026-11-22');

  // An exhausted feed does not change the successful receipt, catalog, history or queue.
  resetFixture();
  const failedClock = clock();
  let failedCalls = 0;
  let failedReceipt;
  await assert.rejects(runRefresh({
    ...failedClock, collectFn: collect, exportFn: async () => assert.fail('No CSV export after failure'),
    record: receipt => {failedReceipt = structuredClone(receipt);},
    makeClient: options => client(failedClock, async () => {failedCalls++; return response(429);}, options),
  }), /HTTP 429/);
  assert.equal(failedCalls, 18);
  assert.equal(failedReceipt.attempts.length, 3);
  assert.equal(failedReceipt.status, 'failed');
  assert.equal(failedReceipt.checkedAt, null);
  assert.deepEqual(snapshot(), before);

  // A valid HTTP response with incomplete pagination is never promoted or retried as rate limiting.
  resetFixture();
  const invalidClock = clock();
  let invalidCalls = 0;
  let invalidReceipt;
  await assert.rejects(runRefresh({
    ...invalidClock, collectFn: collect,
    record: receipt => {invalidReceipt = structuredClone(receipt);},
    makeClient: options => client(invalidClock, async () => {
      invalidCalls++;
      return response(200, [product], {'x-wp-total': '2', 'x-wp-totalpages': '1'});
    }, options),
  }), /Incomplete or shifting/);
  assert.equal(invalidCalls, 1);
  assert.equal(invalidReceipt.attempts.length, 1);
  assert.deepEqual(snapshot(), before);
} finally {
  process.chdir(originalCwd);
  assert.equal(path.dirname(fixture), path.resolve(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith('catalog-recovery-test-'));
  fs.rmSync(fixture, {recursive: true, force: true});
}

// An export failure must not cause another collection/history append.
{
  const c = clock();
  let collections = 0;
  let last;
  await assert.rejects(runRefresh({
    ...c, collectFn: async () => {collections++; return {checkedAt: new Date(c.now()).toISOString()};},
    exportFn: async () => {throw Error('synthetic export failure');},
    record: receipt => {last = structuredClone(receipt);},
  }), /synthetic export failure/);
  assert.equal(collections, 1);
  assert.equal(last.status, 'failed');
  assert.equal(last.phase, 'csv-export');
}

// Outer attempts share a hard budget and honor long server cooldowns.
{
  const c = clock();
  let calls = 0;
  await assert.rejects(runRefresh({
    ...c, maxDurationMs: 10 * 60_000,
    collectFn: async () => {
      calls++;
      throw Object.assign(Error('long cooldown'), {retryable: true, retryAt: c.now() + 60 * 60_000});
    },
    record: () => {},
  }), /long cooldown/);
  assert.equal(calls, 1);
  assert.deepEqual(c.waits, []);
}
console.log('Refresh recovery passed: paced requests, Retry-After, bounded recovery, intact snapshots, exact dates and no duplicate history.');
