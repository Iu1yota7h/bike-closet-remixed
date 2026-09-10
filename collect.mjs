import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const textCode=ts.transpileModule(fs.readFileSync(new URL('./lib/catalog-text.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {cleanCatalogText}=await import('data:text/javascript;base64,'+Buffer.from(textCode).toString('base64'));
const root='https://bikecloset.com/wp-json/wc/store/v1/products';
const read=(p,f)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):f;
export async function getJSON(url){
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(60000),headers:{'User-Agent':'BikeClosetIndex/1.0 (+https://github.com/Iu1yota7h/bike-closet-remixed)'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return {body:await r.json(),headers:r.headers};}
  catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,1000*2**attempt));}
 }
}
export function validatePages(pages){
 const total=Number(pages[0].headers.get('x-wp-total'));const expected=Number(pages[0].headers.get('x-wp-totalpages'));
 const rows=pages.flatMap(p=>p.body);
 if(!Number.isSafeInteger(total)||total<1||expected!==pages.length||rows.length!==total||new Set(rows.map(r=>r.id)).size!==total||pages.some(p=>Number(p.headers.get('x-wp-total'))!==total))throw Error('Incomplete or shifting feed; previous snapshot retained');
 return rows;
}
async function all(type){const query=`${root}?per_page=100&orderby=date&order=desc${type}`;const first=await getJSON(query+'&page=1');const count=Number(first.headers.get('x-wp-totalpages'));if(!Number.isSafeInteger(count)||count<1||count>500)throw Error('Invalid pagination');const pages=[first];for(let p=2;p<=count;p+=3){pages.push(...await Promise.all(Array.from({length:Math.min(3,count-p+1)},(_,i)=>getJSON(query+'&page='+(p+i)))));}return validatePages(pages);}
export function normalize(products,variants,previous,now,allowShrink=false){
 const parents=new Map(products.map((p,i)=>[p.id,{...p,newestRank:i}]));const old=new Map((previous?.rows||[]).map(r=>[r.id,r]));const events=[];
 const rows=[...products.filter(p=>p.type!=='variable'),...variants].map(v=>{
  const p=parents.get(v.parent)||parents.get(v.id)||v;
  if(!Number.isSafeInteger(v.id)||typeof v.is_in_stock!=='boolean'||v.prices?.currency_code!=='USD')throw Error('Invalid feed row');
  const price=s=>{if(s==='')return null;const n=Number(s)/10**v.prices.currency_minor_unit;if(!Number.isFinite(n)||n<0)throw Error('Invalid price');return n;};
  let url=null;try{const u=new URL(v.permalink);if(u.protocol==='https:'&&u.hostname==='bikecloset.com')url=u.href;}catch{}
  const q=new URL(url||'https://bikecloset.com').searchParams;
  const at=Object.fromEntries((p.variations?.find(x=>x.id===v.id)?.attributes||[]).map(a=>[a.name,a.value]));
  const before=old.get(v.id);
  const row={id:v.id,productId:v.parent||v.id,name:(p.name||'Unnamed variant').replaceAll('&amp;','&').replaceAll('&#8211;','–'),category:(p.categories||[]).map(c=>c.name).filter(c=>!/^merchant|moving sale|uncategorized$/i.test(c)).join(' / '),size:at.Size||q.get('attribute_pa_size')||q.get('attribute_size'),color:at.Color||q.get('attribute_pa_color')||q.get('attribute_color'),variant:v.variation||'',price:price(v.prices.price),reference:price(v.prices.regular_price),stock:v.is_in_stock,url,sku:v.sku,newestRank:p.newestRank??null,firstSeen:before?.firstSeen||previous?.checkedAt||now,observedAt:now,change:null};
  if(!before){row.firstSeen=now;row.change=previous?'new':null;}
  else if(before.price!==row.price&&before.price!==null&&row.price!==null)row.change=row.price<before.price?'price-drop':'price-rise';
  else if(!before.stock&&row.stock)row.change='restock';
  if(!before||before.price!==row.price||before.stock!==row.stock)events.push({at:now,id:row.id,previousPrice:before?.price??null,price:row.price,previousStock:before?.stock??null,stock:row.stock,event:row.change||'baseline'});
  return cleanCatalogText(row);
 });
 if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate variant IDs');
 if(previous&&!allowShrink&&rows.length<previous.rows.length*.75)throw Error('Unexpected catalog shrink; manual review required');
 return {rows,events};
}
export async function collect(){
 const previous=read('public/catalog.json',null);const products=await all('');const variants=await all('&type=variation');const now=new Date().toISOString();const {rows,events}=normalize(products,variants,previous,now,process.argv.includes('--accept-reviewed-shrink'));
 const output={checkedAt:now,products:products.length,variants:variants.length,representedProducts:new Set(rows.map(r=>r.productId)).size,rows};
 // No writes occur until every page and normalized row passes validation.
 const comparable=rs=>JSON.stringify(rs.map(({observedAt,...r})=>r));
 const changed=!previous||comparable(previous.rows)!==comparable(rows);
 if(changed){fs.writeFileSync('public/catalog.json.tmp',JSON.stringify(output));fs.renameSync('public/catalog.json.tmp','public/catalog.json');}
 fs.appendFileSync('data/history.jsonl',events.map(e=>JSON.stringify(e)).join('\n')+(events.length?'\n':''));
 const status=read('public/status.json',{});status.inventory={checkedAt:now,status:'success',schedule:'Daily · 12 AM Pacific'};fs.writeFileSync('public/status.json',JSON.stringify(status,null,2)+'\n');
 console.log(`Collected ${products.length} products, ${variants.length} variants; ${events.length} price/stock events.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collect();
