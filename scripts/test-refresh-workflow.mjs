import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync(new URL('../.github/workflows/refresh.yml',import.meta.url),'utf8');

assert.match(workflow,/cron: '17 0 \* \* \*'/,'Refresh catalog must run at 12:17 AM.');
assert.match(workflow,/timezone: America\/Los_Angeles/,'Refresh catalog must remain Pacific-time and DST-aware.');
