import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync(new URL('../.github/workflows/refresh.yml',import.meta.url),'utf8');

assert.match(workflow,/cron: '17 0 \* \* \*'/,'Refresh catalog must run at 12:17 AM.');
assert.match(workflow,/timezone: America\/Los_Angeles/,'Refresh catalog must remain Pacific-time and DST-aware.');

assert.match(workflow,/timeout-minutes: 90/,'Recovery must fit inside the job budget.');
assert.match(workflow,/run: node scripts\/refresh-catalog\.mjs\n\s+timeout-minutes: 80/,'Run collection and export through the bounded recovery entry point.');
assert.match(workflow,/if: \$\{\{ !cancelled\(\) && success\(\) \}\}/,'Never commit failed or partial collection output.');
assert.match(workflow,/Keep catalog recovery evidence\n\s+if: \$\{\{ !cancelled\(\) \}\}/,'Keep evidence after failures without requiring the job to succeed.');
assert.match(workflow,/uses: actions\/upload-artifact@v7/);
assert.match(workflow,/retention-days: 14/);
for(const file of ['work/refresh-attempt.json','public/catalog.json','public/in-stock.csv','public/status.json','data/history.jsonl']) assert.ok(workflow.includes('            '+file));
assert.doesNotMatch(workflow,/continue-on-error|accept-reviewed-shrink/,'Recovery must not bypass validation or job failures.');
