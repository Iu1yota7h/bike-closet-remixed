export type SizingItem={name:string;size:string|null;variant:string;group:string;type:string};
const aliases:Record<string,string>={xxs:'XXS',xs:'XS',xsm:'XS','extra small':'XS',s:'S',sm:'S',sml:'S',small:'S',m:'M',md:'M',med:'M',medium:'M',l:'L',lg:'L',lrg:'L',large:'L',xl:'XL','extra large':'XL',xxl:'2XL','2xl':'2XL',xxxl:'3XL','3xl':'3XL'};
const rank=['XXS','XS','S','S/M','M','M/L','L','L/XL','XL','XL/2XL','2XL','3XL','One size'];
function decodeSize(value:string){
 return value.replace(/&amp;/gi,'&').replace(/&(?:times|#215|#x0*d7);/gi,'×').replace(/&(?:nbsp|#160|#x0*a0);/gi,' ');
}
export function sizing(r:SizingItem){
 const combined=r.variant?.match(/(?:^|,\s*)Color\/Size:\s*([^,]+)/i)?.[1]?.trim()||'';
 const titleSize=r.type==='Tires'?r.name.match(/\b(?:700[cCbB]?|650[cCbB]?|29|27\.5|26)\s*[x×]\s*\d+(?:\.\d+)?(?:mm|[cC])?\b/)?.[0]:
  r.type==='Helmets'?r.name.match(/\b(?:XXS|XS|S\/M|M\/L|L\/XL|XL|Small|Medium|Large)\b(?:\s+\d{2}[-–]\d{2}\s*cm)?/i)?.[0]:
  r.group==='Clothing'?r.name.match(/\b(?:XXS|XS|SM|MD|LG|XL|2XL|3XL|Small|Medium|Large)\s*$/i)?.[0]:
  r.type==='Cycling shoes'?r.name.match(/\b(?:3\d|4\d|50)(?:\.5)?\s*(?:\(Final Sale\))?$/i)?.[0]?.replace(/\s*\(Final Sale\)$/i,''):'';
 const exact=decodeSize(r.variant?.match(/(?:^|,\s*)Size:\s*([^,]+)/i)?.[1]?.trim()||r.size?.replaceAll('-',' ')||(['Tires','Gloves'].includes(r.type)?combined:'')||titleSize||'');
 const domain=r.type==='Cycling shoes'?'Shoes':r.type==='Helmets'?'Helmets':r.type==='Tires'?'Tires':r.type==='Socks'?'Socks':r.group==='Clothing'?'Clothing':r.type;
 let token=exact.trim(), note='';
 if(r.type==='Gloves'&&combined&&exact===decodeSize(combined)){
  token=exact.match(/(?:^|\s)(Y-)?(XXS|XS|SM|S|MD|M|LG|L|XL|XXL|2XL|3XL)\s*$/i)?.[0]?.trim()||'';
  if(/^Y-/i.test(token))token='Youth '+(aliases[token.slice(2).toLowerCase()]||token.slice(2));
 }
 if(r.type==='Helmets')token=token.replace(/\s+\d{2}[-–]\d{2}\s*cm$/i,'');
 if(!token)return {officialSize:exact,sizeToken:'',sizeKey:'',sizeLabel:'',sizeRank:999,domain};
 if(r.type==='Lights')return {officialSize:exact,sizeToken:'',sizeKey:'',sizeLabel:'',sizeRank:999,domain}; // Retailer misuses Size for color.
 if(domain==='Shoes'&&/^\d+(?:[. -][05])?$/.test(token)){token=String(Number(token.replace(/[ -]/,'.')))}
 else if(domain==='Tires'){
   const dimensions=token.match(/^(700|650)([cb]?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
   const inches=token.match(/^(29|27\.5|26)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
   const width=token.match(/^(\d+(?:\.\d+)?)\s*(?:mm)?$/i);
   if(dimensions)token=`${dimensions[1]}${dimensions[1]==='700'&&dimensions[2].toLowerCase()!=='b'?'':dimensions[2].toUpperCase()} × ${Number(dimensions[3])} mm`;
   else if(inches)token=`${inches[1]} × ${Number(inches[2])} in`;
   else if(width)token=/700c|700\s*[x×]/i.test(r.name)?`700 × ${Number(width[1])} mm`:`${Number(width[1])} mm`;
 }else{
   const lower=token.toLowerCase().replace(/–/g,'-').trim();
   const combo=lower.split(/\s*[\/-]\s*/);
   if(combo.length===2&&aliases[combo[0]]&&aliases[combo[1]])token=aliases[combo[0]]+'/'+aliases[combo[1]];
   else if(lower==='xlg'&&/^(poc|rapha)\b/i.test(r.name))token='XL';
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

// Combined alphabetic sizes belong to both filters; numeric ranges stay intact.
export function sizeOptions(r:ReturnType<typeof sizing>){
 if(!r.sizeKey)return [];
 const parts=r.sizeLabel.split('/');
 const labels=parts.length===2&&parts.every(p=>/^(XXS|XS|S|M|L|XL|2XL|3XL)$/.test(p))?parts:[r.sizeLabel];
 return labels.map(label=>({key:r.domain.toLowerCase()+':'+label.toLowerCase(),label,token:label.toLowerCase(),domain:r.domain,rank:rank.includes(label)?rank.indexOf(label):r.sizeRank}));
}

// Presentation only: strip a trailing wearable size only when it matches the
// exact size already available to the listing. Never strip component dimensions.
export function displayProductName(r:SizingItem & ReturnType<typeof sizing>){
 if(!r.officialSize||!r.sizeKey)return r.name;
 const wearable=r.group==='Clothing'||r.type==='Helmets';
 if(!wearable&&r.type!=='Cycling shoes')return r.name;
 const suffix=wearable?/\s+\(?(XXS|XS|S|SM|SML|Small|M|MD|Medium|L|LG|Large|XL|XXL|2XL|XXXL|3XL|XLG|TIR|S\/M|M\/L|L\/XL|XL\/2XL)\)?(?=\s*(?:\(Final Sale\))?\s*$)/i:/\s+\(?(3\d|4\d|50)(?:\.5)?\)?(?=\s*(?:\(Final Sale\))?\s*$)/i;
 const match=r.name.match(suffix);if(!match)return r.name;
 const candidate=match[0].trim().replace(/^\(|\)$/g,'');
 const parsed=sizing({...r,size:candidate,variant:''});
 return parsed.sizeKey===r.sizeKey?r.name.replace(suffix,'').trim():r.name;
}
