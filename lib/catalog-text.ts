// Decode retailer text as text, never as HTML markup.
export function decodeCatalogText(value:string):string{
 const named:Record<string,string>={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',times:'×',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',ndash:'–',mdash:'—',hellip:'…',reg:'®',trade:'™',copy:'©'};
 let result=value;
 for(let pass=0;pass<2;pass++){
  result=result.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(entity,code:string)=>{
   if(!code.startsWith('#'))return named[code.toLowerCase()]??entity;
   const point=code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):Number(code.slice(1));
   return point>0&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):entity;
  });
 }
 return result;
}
export function cleanCatalogText<T extends {name:string;category:string;variant:string;size:string|null;color:string|null}>(row:T):T{
 return {...row,name:decodeCatalogText(row.name),category:decodeCatalogText(row.category),variant:decodeCatalogText(row.variant),size:row.size===null?null:decodeCatalogText(row.size),color:row.color===null?null:decodeCatalogText(row.color)};
}
