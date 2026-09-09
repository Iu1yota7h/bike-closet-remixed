import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/catalog-sizes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;const {sizing,sizeOptions}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const [size,expected] of [['M/L',['M','L']],['S/M',['S','M']],['XL/2XL',['XL','2XL']],['52-58',['52-58']]]){const s=sizing({name:'Helmet',size:null,variant:'Size: '+size,group:'Footwear & protection',type:'Helmets'});assert.equal(s.officialSize,size);assert.deepEqual(sizeOptions(s).map(o=>o.label),expected);}
console.log('Combined alphabetic sizes match both filters; exact labels and numeric ranges preserved.');
