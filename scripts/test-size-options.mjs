import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/catalog-sizes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;const {sizing,sizeOptions}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const [size,expected] of [['M/L',['M','L']],['S/M',['S','M']],['XL/2XL',['XL','2XL']],['52-58',['52-58']]]){const s=sizing({name:'Helmet',size:null,variant:'Size: '+size,group:'Footwear & protection',type:'Helmets'});assert.equal(s.officialSize,size);assert.deepEqual(sizeOptions(s).map(o=>o.label),expected);}
console.log('Combined alphabetic sizes match both filters; exact labels and numeric ranges preserved.');
const tire=variant=>sizing({name:'Road tire 700c',size:null,variant,group:'Wheels & tires',type:'Tires'});
for(const raw of ['700&#215;28','700&#xD7;28','700&times;28','700 × 28 mm','700c x 28','28mm'])assert.equal(tire('Size: '+raw).sizeKey,'tires:700 × 28 mm');
assert.equal(tire('Color/Size: 700&#215;25 Tan').sizeLabel,'700 × 25 mm');
assert.equal(tire('Color/Size: 700&#215;25 Tan').officialSize,'700×25 Tan');
assert.notEqual(tire('Size: 650B x 40').sizeKey,tire('Size: 650C x 40').sizeKey);
assert.equal(sizing({name:'Tire',size:'28mm',variant:'',group:'Wheels & tires',type:'Tires'}).sizeLabel,'28 mm');
console.log('Tire entities and equivalent dimensions consolidated; official detail and wheel standards preserved.');
