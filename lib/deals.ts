export type MarketEvidence={price:number;checkedAt:string;url:string;exactMatch:boolean;inStock:boolean;basis:'item-price';quality:number;tier:number;qualitySource:string;tierSource:string;retailer:string;confidence:string;listingPrice:number;listingCheckedAt:string;lastCheckError?:string|null};
export function dealSavings(row:{id:number;price:number|null},now=Date.now(),marketEvidence:Record<number,MarketEvidence>={}):number|null{
 const e=marketEvidence[row.id];if(!e||e.lastCheckError||!e.exactMatch||!e.inStock||!e.url||row.price===null||e.price<=0||row.price!==e.listingPrice)return null;
 for(const date of [e.checkedAt,e.listingCheckedAt]){const age=now-Date.parse(date);if(!Number.isFinite(age)||age<0||age>7*86400000)return null;}
 if(!Number.isFinite(e.price)||!Number.isFinite(row.price)||row.price<0||row.price>=e.price)return null;
 return 100*(1-row.price/e.price);
}
