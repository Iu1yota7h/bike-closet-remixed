// Research belongs to the parent product, never an individual size/color variant.
// A completed search with limited/no evidence still counts as researched.
const item=({id,productId,name,price,reference,url,detectedAt,status})=>({
 id,productId,name,price,reference,url,
 ...(detectedAt?{detectedAt}:{}),
 ...(status?{status}:{}),
});

export function newProductArrivals(previousRows,rows){
 if(!Array.isArray(previousRows))return [];
 const previousParents=new Set(previousRows.map(r=>String(r.productId)));
 const selected=new Map();
 const candidates=rows.filter(r=>r.stock&&r.url&&!previousParents.has(String(r.productId)))
  .sort((a,b)=>(a.newestRank??Number.MAX_SAFE_INTEGER)-(b.newestRank??Number.MAX_SAFE_INTEGER)||a.id-b.id);
 for(const row of candidates)if(!selected.has(String(row.productId)))selected.set(String(row.productId),item(row));
 return [...selected.values()];
}

export function researchShortlist(pending,research,completed=[],limit=5){
 const done=new Set([...Object.keys(research),...completed.map(r=>String(r.productId))]);
 const selected=new Map();
 for(const row of pending)if(!done.has(String(row.productId))&&!selected.has(String(row.productId)))selected.set(String(row.productId),item(row));
 return [...selected.values()].slice(0,limit);
}

export function updateResearchQueue(current,previousRows,rows,research,now,limit=5){
 const completed=Array.isArray(current?.completed)?current.completed:[];
 const done=new Set([...Object.keys(research||{}),...completed.map(r=>String(r.productId))]);
 const carried=Array.isArray(current?.pending)?current.pending:(Array.isArray(current?.shortlist)?current.shortlist:[]);
 const pending=new Map(carried.filter(r=>!done.has(String(r.productId))).map(r=>[String(r.productId),item(r)]));
 const added=[];
 for(const arrival of newProductArrivals(previousRows,rows)){
  const key=String(arrival.productId);
  if(done.has(key)||pending.has(key))continue;
  const queued={...arrival,detectedAt:now,status:'awaiting-research'};
  pending.set(key,queued);added.push(queued);
 }
 const allPending=[...pending.values()];
 return {
  queue:{...current,generatedAt:now,trigger:'new-parent-products',maxNewModels:limit,pending:allPending,shortlist:researchShortlist(allPending,research,completed,limit),completed},
  added,
 };
}
