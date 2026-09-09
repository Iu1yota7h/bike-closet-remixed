import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/catalog-groups.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;const {apparel,classify,matchesClothingFit}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const a=(name,category='')=>apparel({name,category,group:'Clothing'});
assert.equal(a('Rapha Women&#8217;s Core Bib Shorts').audience,"Women's");assert.equal(a('POC M&#8217;s Cadence Jersey').audience,"Men's");assert.equal(a('UMA Jersey',"Women's All").audience,"Women's");assert.equal(a('Unisex Trail Jersey').audience,'Unisex');assert.equal(a('Plain Jersey').audience,'Unspecified');assert.deepEqual(a('Bib Shorts Gravel Grey').ridingStyles,['Unspecified']);assert.deepEqual(a('Gravel Trail Jersey').ridingStyles,['Gravel','Mountain / trail']);assert.deepEqual(apparel({name:'MTB tire',category:'',group:'Wheels & tires'}).ridingStyles,[]);
const d=JSON.parse(fs.readFileSync('public/catalog.json'));const rows=[...new Map(d.rows.filter(r=>r.stock).map(r=>[r.productId,r])).values()].map(r=>{const g={...r,...classify(r)};return {...g,...apparel(g)}}).filter(r=>r.group==='Clothing');console.log('Clothing products by fit:',Object.fromEntries(["Men's","Women's",'Unisex','Unspecified'].map(x=>[x,rows.filter(r=>r.audience===x).length])));console.log('Apparel checks passed.');

for(const selected of ["Men's","Women's"]){assert.equal(matchesClothingFit('Unisex',selected),true);assert.equal(matchesClothingFit('Unspecified',selected),true);assert.equal(matchesClothingFit('',selected),false);assert.equal(matchesClothingFit(selected,selected),true);}
assert.equal(matchesClothingFit("Women's","Men's"),false);assert.equal(matchesClothingFit("Men's","Women's"),false);
for(const name of ['100% RIDECAMP Youth','Junior Jersey','Kids Gloves','Boys Trail Shorts','Girls Jersey','Child Jacket']){
 assert.equal(a(name,"Men's / Unisex").audience,'Youth');
}
assert.equal(a('Trail Jersey','Youth Clothing').audience,'Youth');
assert.equal(a('Kidney warmer').audience,'Unspecified');
assert.equal(matchesClothingFit('Youth',"Men's"),false);
assert.equal(matchesClothingFit('Youth',"Women's"),false);
assert.equal(matchesClothingFit('Youth','Youth'),true);
assert.equal(matchesClothingFit('Unspecified','Youth'),false);
assert.equal(matchesClothingFit('Unisex','Youth'),false);
assert.equal(matchesClothingFit('Youth','all'),true);
assert.equal(a('Gibraltar Vest WMNS Black SM').audience,"Women's");
assert.equal(classify({name:'Assos MILLE GT 3/3 Jacket EVO',category:'Jerseys'}).type,'Jackets & rain shells');
assert.equal(classify({name:'POC Ultra Saddle Bag 7L',category:'Saddles'}).type,'Bags & packs');
assert.equal(classify({name:'Silca EOLO IV REGULATOR BLACK/RED',category:'Bags/Packs'}).type,'CO2 inflators');
assert.equal(classify({name:'Garmin Edge 850',category:''}).type,'Cycling computers');
