// Research belongs to the parent product, never an individual size/color variant.
// A completed search with limited/no evidence still counts as researched.
export function researchShortlist(rows,research,completed=[],limit=5){
 const done=new Set([...Object.keys(research),...completed.map(r=>String(r.productId))]);
 const selected=new Map();
 const candidates=rows.filter(r=>r.stock&&r.url&&!done.has(String(r.productId))&&r.price>0&&r.reference>r.price)
  .sort((a,b)=>(1-b.price/b.reference)-(1-a.price/a.reference));
 for(const r of candidates)if(!selected.has(r.productId))selected.set(r.productId,r);
 return [...selected.values()].slice(0,limit).map(({id,productId,name,price,reference,url})=>({id,productId,name,price,reference,url}));
}
