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
    if (note) body += `<p>${escape(note.summary)}</p>${note.reviewScope?`<p>${escape(note.reviewScope)}</p>`:''}${note.checkedAt?`<p>Research date: ${escape(note.checkedAt)}. ${escape(note.evidenceType==='specifications'?'Specifications only':note.evidenceType==='listing'?'Limited evidence':'Review summary')}.</p>`:''}<p>${sources(note.sources)}</p>${note.sizingNote?`<p>Fit &amp; compatibility: ${escape(note.sizingNote)}</p><p>${sources(note.sizingSources)}</p>`:''}`;
    body += '</article>';
  }
  body += '</section>';
}
fs.writeFileSync('public/catalog.html',page('/catalog','In-stock cycling catalog','Browse in-stock Bike Closet products, exact size and color options, and sourced product notes without JavaScript.',body));
fs.writeFileSync('public/about.html',page('/about','About the data','How Bike Closet Remixed checks stock, normalizes sizes, researches products and compares prices.',`<p>Bike Closet Remixed is a free, independent catalog that links you to Bike Closet to buy. No account is needed.</p><h2>Inventory and sizes</h2><p>Inventory checks run daily at midnight America/Los_Angeles, following PST/PDT. Checks may be delayed or fail; the catalog retains the last successful snapshot. Only options marked in stock at that check are displayed. Availability can change before checkout.</p><p>Filters combine equivalent size labels. Combined sizes such as M/L appear under both M and L; exact retailer details remain visible. Men’s and women’s clothing filters include unisex and unspecified clothing. Youth clothing stays separate.</p><h2>Prices and deals</h2><p>Prices are USD, before tax and shipping. Retailer reference prices are not independently verified market prices. Discounted only means the current price is below that retailer reference.</p><p>Check prices links open Google Shopping using the product name and listed size/color, with US results requested. No search runs until you click. We do not collect competitor prices or score market deals. Search results may include different variants; verify the exact item, availability and total cost at the retailer.</p><h2>Product research</h2><p>Model-level review and sizing research is completed once and reused across sizes and colors. Corrections or materially different models can require another review. Each summary identifies its evidence and sources; specifications and limited evidence are not independent reviews. Research dates are separate from inventory check dates.</p><h2>Open data</h2><p>The CSV and JSON links above contain dated catalog facts. <a href="./research.json">Research JSON</a> contains summaries and citations. Missing values mean unknown, not zero.</p><p><a href="https://github.com/Iu1yota7h/bike-closet-remixed">Source code, correction requests and contribution instructions on GitHub</a>.</p>`));
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\n${base?`Sitemap: ${base}/sitemap.xml\n`:''}`);
if (base) fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/catalog','/about'].map(p=>`<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
else if(fs.existsSync('public/sitemap.xml')) fs.unlinkSync('public/sitemap.xml');
console.log(`Prepared ${products.size} products / ${rows.length} in-stock options; browse payload ${fs.statSync('public/browse-catalog.json').size} bytes (source ${fs.statSync('public/catalog.json').size}). Sitemap ${base?'enabled':'awaiting SITE_URL'}.`);
