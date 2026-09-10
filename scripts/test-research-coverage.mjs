import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const research=JSON.parse(fs.readFileSync('public/research.json','utf8'));
const coverage=JSON.parse(fs.readFileSync('data/research-coverage.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/research-audit.json','utf8'));
const queue=JSON.parse(fs.readFileSync('data/research-queue.json','utf8'));
const code=ts.transpileModule(fs.readFileSync('lib/research.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {hasReview}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(hasReview(undefined),false);
assert.equal(hasReview({evidenceType:'listing'}),false);
assert.equal(hasReview({evidenceType:'specifications'}),false);
assert.equal(hasReview({evidenceType:'review'}),true);
assert.equal(hasReview({summary:'Legacy sourced review'}),true);

// Freeze the backfill scope, not the live inventory: new arrivals may await their first research.
assert.equal(new Set(coverage.coveredProductIds).size,coverage.parentProducts);
const entries=coverage.coveredProductIds.map(id=>research[id]);
assert.equal(entries.filter(hasReview).length,coverage.withReview);
assert.equal(entries.filter(r=>r?.evidenceType==='specifications').length,coverage.specificationsOnly);
assert.equal(entries.filter(r=>r?.evidenceType==='listing').length,coverage.limitedEvidence);
const audited=new Set(audit.products.map(p=>p.productId));
assert.equal(audited.size,coverage.newSearches);
const completed=new Set(queue.completed.map(p=>p.productId));
for(const id of coverage.coveredProductIds){
 const r=research[id];
 assert.ok(r?.summary&&r.rating&&r.tier,`Missing research for ${id}`);
 assert.ok(r.sources.length,`Missing source for ${id}`);
 assert.ok(completed.has(id),`Missing completion for ${id}`);
 if(audited.has(id)){
  assert.ok(Number.isFinite(Date.parse(r.checkedAt)),`Missing research date for ${id}`);
  assert.ok(r.sizingNote&&r.sizingSources.length,`Missing fit outcome for ${id}`);
  assert.ok(r.reviewScope,`Missing evidence scope for ${id}`);
  if(hasReview(r))assert.ok(r.sources.some(s=>!new URL(s.url).hostname.endsWith('bikecloset.com')),`Retailer-only review for ${id}`);
 }
 if(r.reusedFromProductId)assert.ok(hasReview(research[r.reusedFromProductId]),`Invalid review reuse for ${id}`);
 for(const s of [...r.sources,...r.sizingSources||[]])assert.equal(new URL(s.url).protocol,'https:');
}
for(const p of audit.products){
 assert.ok(p.query&&p.outcome&&p.adoptedSources.length);
 assert.ok(!('snippet' in p),'Do not commit source excerpts');
}
console.log(`Research coverage: ${coverage.parentProducts} parent products; evidence levels and one-time completion verified.`);
