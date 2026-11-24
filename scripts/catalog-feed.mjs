const MINUTE = 60_000;
const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function retryAfterMs(value, now = Date.now()) {
  if (value == null || value.trim() === '') return 0;
  const text = value.trim();
  if (/^\d+$/.test(text)) return Number(text) * 1000;
  // Invalid numeric values must not be interpreted as JavaScript's loose dates.
  if (!/^[A-Za-z]+, /.test(text) && !/^[A-Za-z]{3} [A-Za-z]{3} /.test(text)) return 0;
  const date = Date.parse(/^[A-Za-z]{3} [A-Za-z]{3} /.test(text) ? text + ' GMT' : text);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

export function validatePages(pages) {
  const total = Number(pages[0].headers.get('x-wp-total'));
  const expected = Number(pages[0].headers.get('x-wp-totalpages'));
  const rows = pages.flatMap(page => page.body);
  if (!Number.isSafeInteger(total) || total < 1 || expected !== pages.length ||
      rows.length !== total || new Set(rows.map(row => row.id)).size !== total ||
      pages.some(page => !Array.isArray(page.body) ||
        Number(page.headers.get('x-wp-total')) !== total ||
        Number(page.headers.get('x-wp-totalpages')) !== expected)) {
    throw Error('Incomplete or shifting feed; previous snapshot retained');
  }
  return rows;
}

export function createFeedClient({
  fetchFn = globalThis.fetch,
  sleep = defaultSleep,
  now = Date.now,
  random = Math.random,
  maxDurationMs = 20 * MINUTE,
  maxAttempts = 6,
  intervalMs = 1000,
  onRetry = message => console.warn(message),
} = {}) {
  const deadline = now() + maxDurationMs;
  let nextRequestAt = now();
  const exhausted = cause => Object.assign(
    new Error('Catalog request budget exhausted; previous snapshot retained', {cause}),
    {retryable: true, retryAt: nextRequestAt, status: cause?.status},
  );

  async function getJSON(url) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (Math.max(now(), nextRequestAt) >= deadline) throw exhausted();
      const wait = Math.max(0, nextRequestAt - now());
      if (wait) await sleep(wait);
      if (now() >= deadline) throw exhausted();
      let response;
      let error;
      try {
        response = await fetchFn(url, {
          signal: AbortSignal.timeout(Math.max(1, Math.min(60_000, deadline - now()))),
          headers: {'User-Agent': 'BikeClosetIndex/1.0 (+https://github.com/Iu1yota7h/bike-closet-remixed)'},
        });
      } catch (cause) {
        error = Object.assign(new Error('Catalog network request failed', {cause}), {retryable: true});
      }
      nextRequestAt = now() + intervalMs;
      if (response?.ok) {
        // Malformed successful responses are data failures, not a reason to keep requesting.
        return {body: await response.json(), headers: response.headers};
      }
      if (response) {
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        const delay = retryAfterMs(response.headers.get('retry-after'), now());
        error = Object.assign(new Error(`HTTP ${response.status}`), {retryable, status: response.status});
        nextRequestAt = Math.max(nextRequestAt, now() + delay);
        await response.body?.cancel();
      }
      if (!error.retryable) throw error;
      const backoff = Math.min(30_000 * 2 ** attempt, 5 * MINUTE);
      nextRequestAt = Math.max(nextRequestAt, now() + backoff) + Math.floor(random() * 1000);
      error.retryAt = nextRequestAt;
      if (attempt === maxAttempts - 1) throw error;
      if (nextRequestAt >= deadline) throw exhausted(error);
      onRetry(`Catalog request ${error.status || 'network error'}; waiting ${Math.ceil((nextRequestAt - now()) / 1000)}s before retry ${attempt + 2}/${maxAttempts}.`);
    }
    throw exhausted();
  }

  async function readAll(query) {
    const first = await getJSON(query + '&page=1');
    const count = Number(first.headers.get('x-wp-totalpages'));
    if (!Number.isSafeInteger(count) || count < 1 || count > 500) throw Error('Invalid pagination');
    const pages = [first];
    // One request at a time: retries pause the entire feed, including the next page.
    for (let page = 2; page <= count; page++) pages.push(await getJSON(query + '&page=' + page));
    return validatePages(pages);
  }

  return {getJSON, readAll};
}
