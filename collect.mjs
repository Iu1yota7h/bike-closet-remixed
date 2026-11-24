import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {updateResearchQueue} from './scripts/research-queue.mjs';
import {createFeedClient} from './scripts/catalog-feed.mjs';
export {validatePages} from './scripts/catalog-feed.mjs';
const textCode=ts.transpileModule(fs.readFileSync(new URL('./lib/catalog-text.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {cleanCatalogText}=await import('data:text/javascript;base64,'+Buffer.from(textCode).toString('base64'));
const root='https://bikecloset.com/wp-json/wc/store/v1/products';
export const INVENTORY_SCHEDULE='Daily · 12:17 AM Pacific';
const read=(p,f)=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):f;
export async function getJSON(url){return createFeedClient().getJSON(url);}
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
export async function collect({client=createFeedClient(),observationTime=()=>new Date().toISOString()}={}){
 const previous=read('public/catalog.json',null);const query=`${root}?per_page=100&orderby=date&order=desc`;const products=await client.readAll(query);const variants=await client.readAll(query+'&type=variation');const now=observationTime();const {rows,events}=normalize(products,variants,previous,now,process.argv.includes('--accept-reviewed-shrink'));
 const output={checkedAt:now,products:products.length,variants:variants.length,representedProducts:new Set(rows.map(r=>r.productId)).size,rows};
 const currentQueue=read('data/research-queue.json',{completed:[]});const research=read('public/research.json',{});const {queue,added}=updateResearchQueue(currentQueue,previous?.rows,rows,research,now,5);
 // No writes occur until every page and normalized row passes validation.
 const comparable=rs=>JSON.stringify(rs.map(({observedAt:_observedAt,...r})=>r));
 const changed=!previous||comparable(previous.rows)!==comparable(rows);
 if(changed){fs.writeFileSync('public/catalog.json.tmp',JSON.stringify(output));fs.renameSync('public/catalog.json.tmp','public/catalog.json');}
 fs.writeFileSync('data/research-queue.json.tmp',JSON.stringify(queue,null,2)+'\n');fs.renameSync('data/research-queue.json.tmp','data/research-queue.json');
 fs.appendFileSync('data/history.jsonl',events.map(e=>JSON.stringify(e)).join('\n')+(events.length?'\n':''));
 const status=read('public/status.json',{});status.inventory={checkedAt:now,status:'success',schedule:INVENTORY_SCHEDULE};fs.writeFileSync('public/status.json',JSON.stringify(status,null,2)+'\n');
 console.log(`Collected ${products.length} products, ${variants.length} variants; ${events.length} price/stock events; ${added.length} new parent products queued for one-time review research.`);
 return output;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collect();
