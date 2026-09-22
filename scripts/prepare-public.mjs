import fs from 'node:fs';
import ts from 'typescript';

// Reuse the UI's cleanup rules; never render retailer text as trusted HTML.
async function loadRules(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const {hasReview} = await loadRules('lib/research.ts');
const catalog = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
const research = JSON.parse(fs.readFileSync('public/research.json', 'utf8'));
const rows = catalog.rows.filter(r => r.stock === true && r.url && r.name !== 'Unnamed variant');
fs.writeFileSync('public/browse-catalog.json', JSON.stringify({...catalog, rows}));
const visibleIds=new Set(rows.map(r=>String(r.productId)));
const reviewPayload=Object.fromEntries(Object.entries(research).filter(([id,note])=>visibleIds.has(id)&&hasReview(note)).map(([id,{summary,rating,sources}])=>[id,{evidenceType:'review',summary,rating,sources}]));
fs.writeFileSync('public/browse-reviews.json',JSON.stringify(reviewPayload));
const siteValue = process.env.SITE_URL;
let base;
if (siteValue) {
  const url = new URL(siteValue);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('SITE_URL must be the public HTTPS origin, without a path or credentials.');
  base = url.origin;
}
fs.rmSync('public/catalog.html',{force:true});
fs.rmSync('public/about.html',{force:true});
fs.writeFileSync('public/llms.txt', '# Bike Closet Remixed\n\nAn independent way to browse in-stock Bike Closet products. Not affiliated with Bike Closet.\n\n## Public resources\n\n- [Browse and filter]('+(base||'.')+'/): Find products by size, category and price.\n- [Stock data]('+(base||'.')+'/browse-catalog.json): In-stock rows and snapshot date.\n- [CSV]('+(base||'.')+'/in-stock.csv): Downloadable stock list.\n\nStock checks run daily shortly after midnight Pacific and may be delayed. Read the snapshot date; availability can change. Prices are USD before tax and shipping. Discounts compare the retailer list price, not verified market prices. Review notes summarize linked sources, not first-hand tests by the site owner.\n');
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\n${base?`Sitemap: ${base}/sitemap.xml\n`:''}`);
if (base) fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>`);
else if(fs.existsSync('public/sitemap.xml')) fs.unlinkSync('public/sitemap.xml');
console.log(`Prepared ${visibleIds.size} products / ${rows.length} in-stock options; browse payload ${fs.statSync('public/browse-catalog.json').size} bytes (source ${fs.statSync('public/catalog.json').size}). Sitemap ${base?'enabled':'awaiting SITE_URL'}.`);
