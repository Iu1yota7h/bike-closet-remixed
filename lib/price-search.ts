// Construct an ordinary link locally. No search request runs until a visitor clicks.
export function priceSearchUrl(row:{name:string;size?:string|null;color?:string|null;variant?:string;officialSize?:string}):string{
 const details=[row.name,row.officialSize||row.size,row.color];
 if(!row.size&&!row.officialSize&&!row.color&&row.variant)details.push(row.variant);
 const query=Array.from(new Set(details.filter((s):s is string=>!!s).map(s=>s.replace(/\s+/g,' ').trim()))).join(' ');
 const url=new URL('https://www.google.com/search');
 url.searchParams.set('tbm','shop');url.searchParams.set('q',query);url.searchParams.set('gl','us');
 return url.href;
}
