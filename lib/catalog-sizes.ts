export type SizingItem={name:string;size:string|null;variant:string;group:string;type:string};
const aliases:Record<string,string>={xxs:'XXS',xs:'XS',xsm:'XS','extra small':'XS',s:'S',sm:'S',sml:'S',small:'S',m:'M',md:'M',med:'M',medium:'M',l:'L',lg:'L',lrg:'L',large:'L',xl:'XL','extra large':'XL',xxl:'2XL','2xl':'2XL',xxxl:'3XL','3xl':'3XL'};
const rank=['XXS','XS','S','S/M','M','M/L','L','L/XL','XL','XL/2XL','2XL','3XL','One size'];
export function sizing(r:SizingItem){
 const exact=r.variant?.match(/(?:^|,\s*)Size:\s*([^,]+)/i)?.[1]?.trim()||r.size?.replaceAll('-',' ')||'';
 const domain=r.type==='Cycling shoes'?'Shoes':r.type==='Helmets'?'Helmets':r.type==='Tires'?'Tires':r.type==='Socks'?'Socks':r.group==='Clothing'?'Clothing':r.type;
 let token=exact.trim(), note='';
 if(!token)return {officialSize:'',sizeToken:'',sizeKey:'',sizeLabel:'',sizeRank:999,domain};
 if(r.type==='Lights')return {officialSize:exact,sizeToken:'',sizeKey:'',sizeLabel:'',sizeRank:999,domain}; // Retailer misuses Size for color.
 if(domain==='Shoes'&&/^\d+(?:[. -][05])?$/.test(token)){token=String(Number(token.replace(/[ -]/,'.')))}
 else if(domain==='Tires'){
   const dimensions=token.match(/^(700|650)[cCbB]?\s*[x×]\s*(\d+(?:\.\d+)?)/);
   const width=token.match(/^(\d+(?:\.\d+)?)\s*(?:mm)?$/i);
   if(dimensions)token=`${dimensions[1]} × ${Number(dimensions[2])} mm`;
   else if(width)token=/700c|700\s*[x×]/i.test(r.name)?`700 × ${Number(width[1])} mm`:`${Number(width[1])} mm`;
 }else{
   const lower=token.toLowerCase().replace(/–/g,'-').trim();
   const combo=lower.split(/\s*[\/-]\s*/);
   if(combo.length===2&&aliases[combo[0]]&&aliases[combo[1]])token=aliases[combo[0]]+'/'+aliases[combo[1]];
   else if(lower==='xlg'&&/^poc\b/i.test(r.name))token='XL';
   else if(aliases[lower])token=aliases[lower];
   else if(/^(?:one size|os|o\/s|osfa|uni)$/i.test(token))token='One size';
   else if(/^xlg\b/i.test(token)&&/^assos\b/i.test(r.name))token='ASSOS XLG';
   else if(/^tir$/i.test(token)&&/^assos\b/i.test(r.name))token='ASSOS TIR';
   else if(/^assos\b/i.test(r.name)&&/\b(0|i|ii|iii)$/i.test(token)&&(domain==='Socks'||r.type==='Warmers'))token='ASSOS '+token.match(/\b(0|i|ii|iii)$/i)![1].toUpperCase();
   else{
     const base=lower.match(/^(xxs|xs|s|m|l|xl|2xl|xxl|3xl|small|medium|large)\b(?:\s*[- ]\s*)?(.*)$/);
     if(base&&/^(?:relaxed fit|standard fit|std|long|standard|\d+\s*[\/-]\s*\d+)$/.test(base[2])){token=aliases[base[1]];note='Fit or length details retained in retailer size';}
     else if(/^blue l$/i.test(token)&&r.name.startsWith('Assos'))token='L';
   }
 }
 const canonical=token.toLowerCase();return {officialSize:exact,sizeToken:canonical,sizeKey:`${domain.toLowerCase()}:${canonical}`,sizeLabel:token,sizeRank:rank.includes(token)?rank.indexOf(token):100,domain,note};
}
