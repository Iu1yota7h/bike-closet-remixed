const brands=['Selle SMP','RockShox','Beto','Selle San Marco','Selle Italia','Louis Garneau','CeramicSpeed','Light Bicycle','CrankBrothers','Campagnolo','Continental','Princeton','Q36.5','Shimano','Castelli','Gibraltar','Goodyear','Garmin','Prologo','Vittoria','Pirelli','Endura','Rapha','Assos','Fizik','Silca','Topeak','Enve','Look','SRAM','Sidi','Kask','Knog','Capo','Giro','Abus','Boyd','Time','POC','KOO','KMC','DMT','100%'];
export function catalogAttributes(item:{name:string}){
 const n=item.name.trim();
 const brand=/^i9\b/i.test(n)?'Industry Nine':brands.find(b=>n.toLowerCase()===b.toLowerCase()||(n.toLowerCase().startsWith(b.toLowerCase())&&/[\s,]/.test(n[b.length]||'')))||'';
 // These describe separate facts: OEM does not establish condition or return policy.
 const condition=/\bopen[ -]box\b/i.test(n)?'Open box':'';
 const packaging=/\bOEM\b/i.test(n)?'OEM':'';
 const saleTerms=/\bfinal sale\b/i.test(n)?'Final sale':'';
 return {brand,condition,packaging,saleTerms};
}
export function matchesListingDetail(item:ReturnType<typeof catalogAttributes>,filter:string){
 return filter==='all'||[item.condition,item.packaging,item.saleTerms].includes(filter);
}
export function searchText(value:string){
 return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s*[×x]\s*(?=\d)/g,'x').replace(/[–—-]/g,' ').replace(/\s+/g,' ').trim();
}
