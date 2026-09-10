import assert from 'node:assert/strict';
import {newProductArrivals,researchShortlist,updateResearchQueue} from './research-queue.mjs';
const row=(id,productId,{stock=true,price=10,rank=id}={})=>({id,productId,price,reference:100,stock,url:'https://bikecloset.com/product/test/',name:`Test ${productId}`,newestRank:rank});
const previous=[row(1,10),row(2,20,{stock:false})];
const current=[row(1,10,{price:5}),row(3,10),row(2,20),row(4,30,{rank:0}),row(5,30,{rank:0}),row(6,40,{stock:false})];

// Only a genuinely new, in-stock parent is an arrival. New variants, price changes
// and restocks keep the existing parent identity and do not trigger research.
assert.deepEqual(newProductArrivals(previous,current).map(r=>r.productId),[30]);
assert.deepEqual(newProductArrivals(null,current),[]);

const first=updateResearchQueue({completed:[]},previous,current,{},'2026-09-10T08:00:00Z');
assert.deepEqual(first.added.map(r=>r.productId),[30]);
assert.equal(first.queue.pending.length,1);
assert.equal(first.queue.shortlist.length,1);
assert.equal(first.queue.trigger,'new-parent-products');

// Re-running the same snapshot adds nothing, and a saved review or completion
// removes the product from pending work even when the result was inconclusive.
assert.equal(updateResearchQueue(first.queue,current,current,{},'later').added.length,0);
assert.equal(updateResearchQueue(first.queue,current,current,{'30':{evidenceType:'listing'}},'later').queue.pending.length,0);
assert.equal(updateResearchQueue(first.queue,current,current,{},'later',5).queue.pending.length,1);
assert.equal(updateResearchQueue(first.queue,current,current,{},'later',5).queue.shortlist.length,1);
assert.equal(updateResearchQueue(first.queue,current,current,{},'later',5).queue.pending[0].detectedAt,'2026-09-10T08:00:00Z');
assert.equal(updateResearchQueue({pending:first.queue.pending,completed:[{productId:30}]},current,current,{},'later').queue.pending.length,0);

const six=Array.from({length:6},(_,i)=>row(100+i,100+i));
const queued=updateResearchQueue({completed:[]},[],six,{},'now',5).queue;
assert.equal(queued.pending.length,6);
assert.equal(queued.shortlist.length,5);
assert.deepEqual(researchShortlist(queued.pending,{'100':{}},[{productId:101}],5).map(r=>r.productId),[102,103,104,105]);
console.log('New-product research is queued once per parent; variants, restocks and price changes do not retrigger it.');
