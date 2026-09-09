export type MarketEvidence={price:number;checkedAt:string;url:string;exactMatch:boolean;inStock:boolean;basis:'item-price';quality:number;tier:number;qualitySource:string;tierSource:string;retailer:string;confidence:string;listingPrice:number;listingCheckedAt:string;lastCheckError?:string|null};
export function dealScore(row:{id:number;price:number|null},now=Date.now(),marketEvidence:Record<number,MarketEvidence>={}):number|null{
 const e=marketEvidence[row.id];if(!e||e.lastCheckError||!e.exactMatch||!e.inStock||!e.url||!e.qualitySource||!e.tierSource||row.price===null||e.price<=0||row.price!==e.listingPrice)return null;
 for(const date of [e.checkedAt,e.listingCheckedAt]){const age=now-Date.parse(date);if(!Number.isFinite(age)||age<0||age>7*86400000)return null;}
 if(e.quality<0||e.quality>1||e.tier<0||e.tier>1||row.price>=e.price)return null;
 return Math.round(100*(.6*Math.min(1,(1-row.price/e.price)/.5)+.3*e.quality+.1*e.tier));
}
