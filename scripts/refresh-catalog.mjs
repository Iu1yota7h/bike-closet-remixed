import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {collect} from '../collect.mjs';
import {createFeedClient} from './catalog-feed.mjs';

const MINUTE = 60_000;
const sleepDefault = ms => new Promise(resolve => setTimeout(resolve, ms));

function saveAttempt(receipt) {
  fs.mkdirSync('work', {recursive: true});
  fs.writeFileSync('work/refresh-attempt.json', JSON.stringify(receipt, null, 2) + '\n');
}

export async function runRefresh({
  collectFn = collect,
  exportFn = () => import('./export-csv.mjs'),
  now = Date.now,
  sleep = sleepDefault,
  record = saveAttempt,
  makeClient = options => createFeedClient(options),
  maxAttempts = 3,
  maxDurationMs = 75 * MINUTE,
  attemptDurationMs = 20 * MINUTE,
  cooldownMs = 5 * MINUTE,
} = {}) {
  const started = now();
  const deadline = started + maxDurationMs;
  const receipt = {
    schemaVersion: 1,
    source: 'https://bikecloset.com/wp-json/wc/store/v1/products',
    startedAt: new Date(started).toISOString(),
    status: 'running',
    phase: 'collection',
    checkedAt: null,
    attempts: [],
  };
  record(receipt);
  for (let number = 1; number <= maxAttempts; number++) {
    const attempt = {number, startedAt: new Date(now()).toISOString(), status: 'running'};
    receipt.attempts.push(attempt);
    record(receipt);
    let output;
    try {
      output = await collectFn({
        client: makeClient({
          maxDurationMs: Math.min(attemptDurationMs, deadline - now()), now, sleep,
        }),
        observationTime: () => new Date(now()).toISOString(),
      });
    } catch (error) {
      Object.assign(attempt, {
        completedAt: new Date(now()).toISOString(), status: 'failed',
        httpStatus: error.status ?? null, retryable: error.retryable === true,
      });
      const retryAt = Math.max(now() + cooldownMs, error.retryAt || 0);
      if (error.retryable === true && number < maxAttempts && retryAt < deadline) {
        receipt.nextAttemptAt = new Date(retryAt).toISOString();
        record(receipt);
        console.warn(`Collection attempt ${number}/${maxAttempts} failed; retrying after ${Math.ceil((retryAt - now()) / 1000)}s.`);
        await sleep(retryAt - now());
        delete receipt.nextAttemptAt;
        continue;
      }
      receipt.status = 'failed';
      receipt.completedAt = new Date(now()).toISOString();
      record(receipt);
      throw error;
    }
    attempt.status = 'success';
    attempt.completedAt = new Date(now()).toISOString();
    receipt.checkedAt = output.checkedAt;
    receipt.phase = 'csv-export';
    record(receipt);
    try {
      await exportFn();
    } catch (error) {
      // Collection already wrote history. Never repeat it because a later export failed.
      receipt.status = 'failed';
      receipt.completedAt = new Date(now()).toISOString();
      record(receipt);
      throw error;
    }
    receipt.phase = 'complete';
    receipt.status = 'success';
    receipt.completedAt = new Date(now()).toISOString();
    record(receipt);
    return receipt;
  }
  throw Error('No collection attempt configured');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runRefresh();
}
