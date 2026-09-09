export type GroupedItem = {name:string;category:string};
export function classify(item:GroupedItem):{group:string;type:string}{
 const n=item.name.toLowerCase(), cats=item.category.toLowerCase().split(' / ');
 const has=(x:string)=>cats.includes(x);
 const result=(group:string,type:string)=>({group,type});
 // Specific product names take precedence over the retailer's promotional tags.
 if(/\bpant\b/.test(n))return result('Clothing','Casual clothing');
 // SILCA identifies Cuscino as bar tape: https://silca.cc/collections/indoor-collection/products/nastro-cuscino-bar-tape
 if(/silca cuscino|bar tape/.test(n))return result('Components','Bar tape & grips');
 if(/^kmc x/.test(n))return result('Components','Chains & chainrings');
 if(/upgrade kit/.test(n))return result('Components','Groupsets & upgrade kits');
 if(/rd sgs|shift switch/.test(n))return result('Components','Derailleurs & shifters');
 if(/hydraulic disc brake/.test(n))return result('Components','Brakes & rotors');
 if(/poc tempor/.test(n))return result('Footwear & protection','Helmets');
 if(/fizik terra powerstrap/.test(n))return result('Footwear & protection','Cycling shoes');
 if(/\b(shoe ?cover|overshoe|toe cover|bootie)/.test(n))return result('Clothing','Shoe covers');
 if(/\b(base ?layer|skin layer|baselayer)/.test(n))return result('Clothing','Base layers');
 if(/\b(arm|leg|knee) ?warmer/.test(n))return result('Clothing','Warmers');
 if(/\b(road ?suit|speed ?suit|chrono ?suit|skinsuit|tri ?suit)/.test(n))return result('Clothing','Skinsuits & tri suits');
 if(/bib ?knicker|\bknicker/.test(n))return result('Clothing','Knicker-length bottoms');
 if(/bib ?tight|\btights?\b/.test(n))return result('Clothing','Tights');
 if(/bib ?short|\bbib\b/.test(n))return result('Clothing','Bib shorts');
 if(/\bshorts?\b/.test(n)&&!(/glove|jersey|sock|sleeve/.test(n)))return result('Clothing','Shorts');
 if(/t-shirt|tee shirt|\bhoodie\b/.test(n))return result('Clothing','Casual clothing');
 if(/\bjersey\b/.test(n)||has('jerseys'))return result('Clothing','Jerseys');
 if(/\bjacket\b|race cape/.test(n)||has('jacket'))return result('Clothing','Jackets & rain shells');
 if(/\bvest\b|\bgilet\b/.test(n))return result('Clothing','Vests');
 if(/\bglove/.test(n)||has('gloves'))return result('Clothing','Gloves');
 if(/sock/.test(n)||has('socks'))return result('Clothing','Socks');
 if(/\bcap\b|\bbeanie\b|headband|neck warmer|balaclava/.test(n)&&!(/hub|torch|hydra|end cap/.test(n)))return result('Clothing','Caps & headwear');
 if(has('casual clothing'))return result('Clothing','Casual clothing');
 if(has('all sidi shoes')||/^sidi\b|\broad shoes\b|\bmtb shoes\b/.test(n))return result('Footwear & protection','Cycling shoes');
 if(has('helmets')||/\bhelmet\b|^kask\b|^poc (procen|ventral|cerebel|cytal|octal)/.test(n))return result('Footwear & protection','Helmets');
 if(has('optics')||/\bglasses\b|\bgoggles\b/.test(n))return result('Footwear & protection','Eyewear');
 if(/\bvpd\b|knee pad|elbow pad/.test(n))return result('Footwear & protection','Body protection');
 if(/valve|rim tape|tubeless tape|sealant/.test(n)&&!(/pump/.test(n)))return result('Wheels & tires','Valves & tubeless supplies');
 if(/smartube|roadtube|sportube|inner tube/.test(n))return result('Wheels & tires','Inner tubes');
 if(has('tires')||/\btire\b|\btyre\b/.test(n))return result('Wheels & tires','Tires');
 if(/wheelset|bora wto/.test(n))return result('Wheels & tires','Wheelsets');
 if(/\bhub|^i9\b|^enve alloy disc rear/.test(n))return result('Wheels & tires','Hubs & parts');
 if(/frameset/.test(n))return result('Components','Framesets');
 if(has('saddles')||/\bsaddle\b/.test(n))return result('Components','Saddles');
 if(/bottom bracket|\bbb\d|\bbbright|^ceramicspeed bsa/.test(n)||has('summer bottom brackets'))return result('Components','Bottom brackets');
 if(/rotor|brake pad|\bbrakes\b|rear adapter/.test(n))return result('Components','Brakes & rotors');
 if(/cassette/.test(n))return result('Components','Cassettes');
 if(/\bchain\b|chainring/.test(n))return result('Components','Chains & chainrings');
 if(/crankset|\bcrank\b/.test(n))return result('Components','Cranksets');
 if(has('pedals')||/\bpedal/.test(n))return result('Components','Pedals & cleats');
 if(/dropper|seatpost|seat post/.test(n))return result('Components','Seatposts');
 if(/handlebar|^enve bar\b/.test(n))return result('Components','Handlebars');
 if(/\bstem\b/.test(n))return result('Components','Stems');
 if(/pump/.test(n))return result('Accessories & tools','Pumps');
 if(has('bags/packs')||/wedge pack|saddle bag/.test(n))return result('Accessories & tools','Bags & packs');
 if(has('lights')||/\blights?\b/.test(n))return result('Accessories & tools','Lights');
 if(has('tools')||/\btool\b/.test(n))return result('Accessories & tools','Tools');
 return result('Other','Needs classification');
}
export const groupOrder=['Clothing','Footwear & protection','Wheels & tires','Components','Accessories & tools','Other'];

// Only explicit listing cues: absence of a women's label does not mean men's.
export function apparel(item:{name:string;category:string;group:string}){
 if(item.group!=='Clothing')return {audience:'',ridingStyles:[] as string[]};
 const clean=(s:string)=>s.toLowerCase().replace(/&#(?:0*39|0*8217);|&apos;|&rsquo;|[’‘]/g,"'");
 const n=clean(item.name),c=clean(item.category);
 const gender=(s:string)=>{
  const women=/\b(women(?:'s|s)?|ladies|female)\b|\bw's\b/.test(s);
  const men=/\b(men(?:'s|s)?|male)\b|\bm's\b/.test(s);
  if(/\bunisex\b/.test(s))return 'Unisex';
  if(women&&men)return 'Unspecified';
  return women?"Women's":men?"Men's":null;
 };
 const youth=/\b(youth|junior|jr|kids?|children(?:'s)?|child|boys?|girls?)\b/.test(n+' / '+c);
 const audience=youth?'Youth':gender(n)||gender(c)||'Unspecified';
 // "Gravel Grey" is a color, not evidence of riding discipline.
 const styleText=(n+' / '+c).replace(/\bgravel\s+gr[ae]y\b/g,'');
 const ridingStyles=[] as string[];
 if(/\b(road|road\s?suit)\b/.test(styleText))ridingStyles.push('Road');
 if(/\bgravel\b/.test(styleText))ridingStyles.push('Gravel');
 if(/\b(mtb|mountain|trail|enduro|downhill|singletrack)\b/.test(styleText))ridingStyles.push('Mountain / trail');
 if(!ridingStyles.length)ridingStyles.push('Unspecified');
 return {audience,ridingStyles};
}

export function matchesClothingFit(itemFit:string,selected:string){
 return selected==='all'||itemFit===selected||(["Men's","Women's"].includes(selected)&&['Unisex','Unspecified'].includes(itemFit));
}
