import fs from 'node:fs';
import {getJSON} from '../collect.mjs';
import {researchShortlist} from './research-queue.mjs';
const market=JSON.parse(fs.readFileSync('public/market.json'));const catalog=JSON.parse(fs.readFileSync('public/catalog.json'));const now=new Date().toISOString();let errors=0,checked=0;
for(const [id,e] of Object.entries(market).slice(0,10)){
 try{
  const u=new URL(e.url);if(u.hostname!=='www.outdoorbros.com')throw Error('No approved adapter for this retailer');
  const {body:p}=await getJSON(u.origin+u.pathname+'.js');const v=p.variants.find(v=>String(v.id)===u.searchParams.get('variant'));
  if(!v||p.title!=='Kask Protone Icon Helmet'||v.title!=='Small / Red'||!p.description.includes('Brand new in box.')||!Number.isFinite(v.price)||v.price<=0)throw Error('Listing identity or condition changed');
  const row=catalog.rows.find(r=>r.id===Number(id));if(!row)throw Error('Bike Closet variant missing');
  Object.assign(e,{price:v.price/100,inStock:v.available===true,checkedAt:now,listingPrice:row.price,listingCheckedAt:JSON.parse(fs.readFileSync('public/status.json')).inventory.checkedAt,lastCheckError:null});checked++;
 }catch(error){e.lastCheckError=error.message;errors++;}
}
fs.writeFileSync('public/market.json',JSON.stringify(market,null,2)+'\n');
const researched=JSON.parse(fs.readFileSync('public/research.json'));
const priorQueue=fs.existsSync('data/research-queue.json')?JSON.parse(fs.readFileSync('data/research-queue.json')):{};
const shortlist=researchShortlist(catalog.rows,researched,priorQueue.completed||[]);
fs.writeFileSync('data/research-queue.json',JSON.stringify({...priorQueue,generatedAt:now,maxNewModels:5,maxMarketRechecks:10,shortlist},null,2)+'\n');
const status=JSON.parse(fs.readFileSync('public/status.json','utf8'));status.market={attemptedAt:now,checkedAt:errors?status.market?.checkedAt||null:now,status:errors?'partial':'success',checked,errors,schedule:'Sunday · 12 AM Pacific'};fs.writeFileSync('public/status.json',JSON.stringify(status,null,2)+'\n');
console.log(`Market check: ${checked} refreshed, ${errors} failed; ${shortlist.length} research candidates.`);
if(errors)process.exitCode=1;
