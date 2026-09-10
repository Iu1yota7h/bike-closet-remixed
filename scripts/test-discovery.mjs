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
  const html=fs.readFileSync('public/catalog.html','utf8');
  const ids=[...html.matchAll(/<article id="product-(\d+)"/g)].map(m=>Number(m[1])).sort((a,b)=>a-b);
  assert.deepEqual(ids,[...new Set(eligible.map(r=>r.productId))].sort((a,b)=>a-b));
  assert(!html.includes('<script'));
  assert(html.includes('rel="canonical" href="https://example.test/catalog"'));
  const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,3);
  assert([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].every(m=>!new URL(m[1]).search));
  run({SITE_URL:''});
  assert(!fs.existsSync('public/sitemap.xml'));
  assert(!fs.readFileSync('public/catalog.html','utf8').includes('rel="canonical"'));
  assert.throws(()=>run({SITE_URL:'https://example.test/private/path'}));
  console.log('Discovery checks passed: exact stock parity, full product coverage, canonical URLs and no placeholder sitemap.');
} finally {
  run({SITE_URL:process.env.SITE_URL||''});
}
