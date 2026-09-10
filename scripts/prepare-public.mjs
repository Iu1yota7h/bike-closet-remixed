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
const nav = '<nav><a href="./">Filter catalog</a> · <a href="./catalog.html">Browse all products</a> · <a href="./about.html">About the data</a> · <a href="./in-stock.csv">CSV</a> · <a href="./browse-catalog.json">JSON</a></nav>';
const page = (path, title, description, body) => `<!doctype html><html lang="en"><head>${head(path,title,description)}</head><body><main>${nav}<h1>${escape(title)}</h1>${body}<footer>Independent project. Not affiliated with Bike Closet. Prices exclude tax and shipping. Confirm availability with the retailer.</footer></main></body></html>`;
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
let body = `<p>${products.size} products with ${rows.length} in-stock options at the inventory check on <time>${escape(catalog.checkedAt)}</time>. Use your browser’s Find command, or open the filter catalog.</p><nav aria-label="Product groups">${[...groups.keys()].map((g,i)=>`<a href="#group-${i}">${escape(g)}</a>`).join(' · ')}</nav>`;
let i = 0;
for (const [group, items] of groups) {
  body += `<section id="group-${i++}"><h2>${escape(group)}</h2>`;
  items.sort((a,b)=>(a[0].newestRank??Infinity)-(b[0].newestRank??Infinity)||a[0].name.localeCompare(b[0].name));
  for (const variants of items) {
    const r=variants[0], note=research[r.productId];
    body += `<article id="product-${r.productId}"><h3><a href="${safeUrl(r.url)}">${escape(displayProductName(r))}</a></h3><p>${escape(classify(r).type)} · <a href="./?q=${encodeURIComponent(r.name)}">Filter these options</a></p><ul>`;
    body += variants.map(v=>`<li>${escape([v.officialSize,v.color,v.variant].filter(Boolean).join(' · ') || 'See retailer for size details')} — ${v.price===null?'Price unavailable':escape(money.format(v.price))} · <a href="${escape(priceSearchUrl(v))}" target="_blank" rel="noopener noreferrer">Check prices on Google Shopping</a></li>`).join('');
    body += '</ul>';
    if (hasReview(note)) body += `<p>${escape(note.summary)}</p><p>${sources(note.sources)}</p>`;
    body += '</article>';
  }
  body += '</section>';
}
fs.writeFileSync('public/catalog.html',page('/catalog','In-stock cycling catalog','Browse in-stock Bike Closet products, exact size and color options, and sourced product notes without JavaScript.',body));
fs.writeFileSync('public/about.html',page('/about','About this site','A simpler way to browse Bike Closet. How stock, discounts and review notes work.',`<p>I love Bike Closet, but going through their website can be such a pain. So I made this to help you find what’s in stock, in your size.</p><h2>Stock and sizes</h2><p>Stock is checked every day at midnight Pacific. The last check is shown on the home page. Something can sell out between checks, so confirm it at Bike Closet before buying.</p><p>Size filters group equivalent labels. M/L shows up under both M and L. The exact retailer size stays in the listing. Men’s and women’s both include unisex and unlabeled clothing; youth items have their own filter.</p><h2>Discounts and prices</h2><p>Discounts are off Bike Closet’s own reference price. That doesn’t mean it’s the cheapest price around. Prices are in US dollars, before tax and shipping.</p><p>Want to compare? “Check prices” opens Google Shopping with the product, size and color filled in. Check that the results match what you want. Searches only happen when you click.</p><h2>Reviews worth reading</h2><p>If there’s a sourced review, you’ll see a short summary and a link. No useful review? No extra panel. These are summaries of other people’s reviews, not my own product tests. A review may cover a different size or color.</p><h2>Use it, share it, improve it</h2><p>No account needed. “Share this view” copies your filters and sorting. Grab the CSV, or <a href="https://github.com/Iu1yota7h/bike-closet-remixed">get the code on GitHub</a>.</p><p>Stock data and saved research are also available as JSON. Missing information means unknown. This is an independent project, not affiliated with Bike Closet.</p>`));
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\n${base?`Sitemap: ${base}/sitemap.xml\n`:''}`);
if (base) fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/catalog','/about'].map(p=>`<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
else if(fs.existsSync('public/sitemap.xml')) fs.unlinkSync('public/sitemap.xml');
console.log(`Prepared ${products.size} products / ${rows.length} in-stock options; browse payload ${fs.statSync('public/browse-catalog.json').size} bytes (source ${fs.statSync('public/catalog.json').size}). Sitemap ${base?'enabled':'awaiting SITE_URL'}.`);
