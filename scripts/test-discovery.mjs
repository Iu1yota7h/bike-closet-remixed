import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run = env => execFileSync(process.execPath,['scripts/prepare-public.mjs'],{env:{...process.env,...env},stdio:'pipe'});
try {
  run({SITE_URL:'https://example.test'});
  const source=JSON.parse(fs.readFileSync('public/catalog.json'));
  const browse=JSON.parse(fs.readFileSync('public/browse-catalog.json'));
  const eligible=source.rows.filter(r=>r.stock===true&&r.url&&r.name!=='Unnamed variant');
  assert.deepEqual(browse.rows,eligible);
  assert(!fs.existsSync('public/catalog.html'));
  const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,1);
  assert(!sitemap.includes('/catalog')&&!sitemap.includes('/about')&&!fs.existsSync('public/about.html'));
  assert([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].every(m=>!new URL(m[1]).search));
  run({SITE_URL:''});
  assert(!fs.existsSync('public/sitemap.xml'));
  assert.throws(()=>run({SITE_URL:'https://example.test/private/path'}));
  console.log('Discovery checks passed: exact stock parity, removed standalone pages and no placeholder sitemap.');
} finally {
  run({SITE_URL:process.env.SITE_URL||''});
}
