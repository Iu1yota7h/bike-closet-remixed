import fs from 'node:fs';import ts from 'typescript';
const src=ts.transpile(fs.readFileSync('lib/catalog-groups.ts','utf8'),{module:ts.ModuleKind.ES2022});const {classify}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const d=JSON.parse(fs.readFileSync('public/catalog.json'));const rows=d.rows.filter(r=>r.stock===true&&r.url&&r.name!=='Unnamed variant').map(r=>({...r,...classify(r)}));
const keys=Object.keys(rows[0]),esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';fs.writeFileSync('public/in-stock.csv',[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n'));
const unique=[...new Map(rows.map(r=>[r.productId,r])).values()];const count={};for(const r of unique)count[r.group+' / '+r.type]=(count[r.group+' / '+r.type]||0)+1;
console.log(JSON.stringify(count,null,2));console.log('UNCLASSIFIED',JSON.stringify(unique.filter(r=>r.group==='Other').map(r=>({name:r.name,category:r.category})),null,2));
