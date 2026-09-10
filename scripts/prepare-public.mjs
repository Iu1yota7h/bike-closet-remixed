import fs from 'node:fs';
import ts from 'typescript';

// Reuse the UI's cleanup rules; never render retailer text as trusted HTML.
async function loadRules(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const {cleanCatalogText} = await loadRules('lib/catalog-text.ts');
const {classify} = await loadRules('lib/catalog-groups.ts');
const {sizing,displayProductName} = await loadRules('lib/catalog-sizes.ts');
const {priceSearchUrl} = await loadRules('lib/price-search.ts');
const {hasReview} = await loadRules('lib/research.ts');
const catalog = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
const research = JSON.parse(fs.readFileSync('public/research.json', 'utf8'));
const rows = catalog.rows.filter(r => r.stock === true && r.url && r.name !== 'Unnamed variant');
fs.writeFileSync('public/browse-catalog.json', JSON.stringify({...catalog, rows}));
const visibleIds=new Set(rows.map(r=>String(r.productId)));
const reviewPayload=Object.fromEntries(Object.entries(research).filter(([id,note])=>visibleIds.has(id)&&hasReview(note)).map(([id,{summary,rating,sources}])=>[id,{evidenceType:'review',summary,rating,sources}]));
fs.writeFileSync('public/browse-reviews.json',JSON.stringify(reviewPayload));
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?escape(u.href):'';} catch {return '';}};
const siteValue = process.env.SITE_URL;
let base;
if (siteValue) {
  const url = new URL(siteValue);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('SITE_URL must be the public HTTPS origin, without a path or credentials.');
  base = url.origin;
}
const head = (path, title, description) => `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Bike Closet Remixed</title><meta name="description" content="${escape(description)}">${base?`<link rel="canonical" href="${base}${path}">`:''}<link rel="stylesheet" href="./reading.css">`;
const nav = '<nav><a href="./">Find your size</a> · <a href="./catalog.html">Browse all products</a> · <a href="./about.html">Why I made this</a> · <a href="./in-stock.csv">CSV</a> · <a href="./browse-catalog.json">JSON</a></nav>';
const page = (path, title, description, body) => `<!doctype html><html lang="en"><head>${head(path,title,description)}</head><body><main>${nav}<h1>${escape(title)}</h1>${body}<footer>I’m not affiliated with Bike Closet. Prices don’t include tax or shipping. Things can sell out, so check stock at checkout.</footer></main></body></html>`;
const products = new Map();
for (const raw of rows) {
  const cleaned = cleanCatalogText(raw);
  const grouped = {...cleaned,...classify(cleaned)};
  const row = {...grouped,...sizing(grouped)};
  if (!products.has(row.productId)) products.set(row.productId, []);
  products.get(row.productId).push(row);
}
const groups = new Map();
for (const variants of products.values()) {
  const group = classify(variants[0]).group;
  if (!groups.has(group)) groups.set(group, []);
  groups.get(group).push(variants);
}
const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const sources = list => (list || []).map(s => safeUrl(s.url)?`<a href="${safeUrl(s.url)}">${escape(s.label)}</a>`:'').filter(Boolean).join(' · ');
let body = `<p>${products.size} products with ${rows.length} sizes and colors in stock when I last checked on <time>${escape(catalog.checkedAt)}</time>. Use your browser’s Find tool to search this list, or head back to pick your size.</p><nav aria-label="Product groups">${[...groups.keys()].map((g,i)=>`<a href="#group-${i}">${escape(g)}</a>`).join(' · ')}</nav>`;
let i = 0;
for (const [group, items] of groups) {
  body += `<section id="group-${i++}"><h2>${escape(group)}</h2>`;
  items.sort((a,b)=>(a[0].newestRank??Infinity)-(b[0].newestRank??Infinity)||a[0].name.localeCompare(b[0].name));
  for (const variants of items) {
    const r=variants[0], note=research[r.productId];
    body += `<article id="product-${r.productId}"><h3><a href="${safeUrl(r.url)}">${escape(displayProductName(r))}</a></h3><p>${escape(classify(r).type)} · <a href="./?q=${encodeURIComponent(r.name)}">See sizes and colors</a></p><ul>`;
    body += variants.map(v=>`<li>${escape([v.officialSize,v.color,v.variant].filter(Boolean).join(' · ') || 'Check Bike Closet for the size')} — ${v.price===null?'Price not listed':escape(money.format(v.price))} · <a href="${escape(priceSearchUrl(v))}" target="_blank" rel="noopener noreferrer">Check prices</a></li>`).join('');
    body += '</ul>';
    if (hasReview(note)) body += `<p>${escape(note.summary)}</p><p>${sources(note.sources)}</p>`;
    body += '</article>';
  }
  body += '</section>';
}
fs.writeFileSync('public/catalog.html',page('/catalog','Everything in stock','See what’s in stock at Bike Closet, with sizes, colors, prices and quick review summaries.',body));
fs.writeFileSync('public/about.html',page('/about','Why I made this','A simpler way to browse Bike Closet. How stock, discounts and review notes work.',`<p>I love Bike Closet, but finding the right stuff can be a pain. I made this so you can see what’s in stock, in your size, without digging through their site.</p><h2>Find what fits</h2><p>Pick a category, size or brand. Click a category under any product to see more like it. “On sale” hides anything that isn’t below Bike Closet’s list price.</p><p>I group size labels that mean the same thing. M/L shows up under both M and L, and Bike Closet’s exact size stays in the listing. Men’s and women’s include unisex clothing and items without a fit label. Youth has its own filter.</p><h2>How fresh is the list?</h2><p>I check stock daily at midnight Pacific. You’ll see the last check on the home page. Things can sell out between checks, so check Bike Closet before buying.</p><h2>Is it a good deal?</h2><p>The discount is based on Bike Closet’s list price. It doesn’t tell you whether someone else has it cheaper. All prices are in US dollars, before tax and shipping.</p><p>Click “Check prices” to search Google Shopping with the product, size and color filled in. Make sure the results match. I don’t run price searches in the background.</p><h2>What about reviews?</h2><p>When I have a useful published review, I show a quick summary and a link. These are other people’s findings—I haven’t personally tested the products. The review may cover a different size, color or version; I keep those differences in the note.</p><h2>Use it however you like</h2><p>No account needed. “Share this view” copies a link with your filters and sorting. You can also download the CSV or <a href="https://github.com/Iu1yota7h/bike-closet-remixed">get the code on GitHub</a> to build on it.</p><p>The stock list and saved review notes are available as JSON too. If something is blank, I don’t have that information. This is my own project, not a Bike Closet site.</p>`));
fs.writeFileSync('public/llms.txt', '# Bike Closet Remixed\n\nAn independent way to browse in-stock Bike Closet products. Not affiliated with Bike Closet.\n\n## Public pages\n\n- [Browse and filter]('+(base||'.')+'/): Find products by size, category and price.\n- [All products]('+(base||'.')+'/catalog): Complete readable HTML catalog; no JavaScript required.\n- [About]('+(base||'.')+'/about): Sources, review scope and limitations.\n- [Stock data]('+(base||'.')+'/browse-catalog.json): In-stock rows and snapshot date.\n- [CSV]('+(base||'.')+'/in-stock.csv): Downloadable stock list.\n\nStock checks run daily at midnight Pacific and may be delayed. Read the snapshot date; availability can change. Prices are USD before tax and shipping. Discounts compare the retailer list price, not verified market prices. Review notes summarize linked sources, not first-hand tests by the site owner.\n');
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\n${base?`Sitemap: ${base}/sitemap.xml\n`:''}`);
if (base) fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/catalog','/about'].map(p=>`<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
else if(fs.existsSync('public/sitemap.xml')) fs.unlinkSync('public/sitemap.xml');
console.log(`Prepared ${products.size} products / ${rows.length} in-stock options; browse payload ${fs.statSync('public/browse-catalog.json').size} bytes (source ${fs.statSync('public/catalog.json').size}). Sitemap ${base?'enabled':'awaiting SITE_URL'}.`);
