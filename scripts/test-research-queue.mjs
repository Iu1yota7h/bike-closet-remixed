import assert from 'node:assert/strict';
import {researchShortlist} from './research-queue.mjs';
const row=(id,productId,price=10)=>({id,productId,price,reference:100,stock:true,url:'https://bikecloset.com/product/test/',name:'Test'});
const rows=[row(1,10),row(2,10,5),row(3,20),row(4,30)];
assert.deepEqual(researchShortlist(rows,{'10':{evidenceType:'specifications'}},[{productId:20}]).map(r=>r.productId),[30]);
// New sizes, colors, restocks and lower prices do not reopen a researched parent.
assert.equal(researchShortlist([...rows,row(99,10,1)],{'10':{}},[{productId:20},{productId:30}]).length,0);
assert.equal(researchShortlist(rows,{}).filter(r=>r.productId===10).length,1);
assert.equal(researchShortlist(rows,{})[0].id,2);
assert.equal(researchShortlist(rows,{},[],1).length,1);
console.log('Completed research reused across variants and price changes; completion ledger and queue limit preserved.');
