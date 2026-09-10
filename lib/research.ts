export type ProductResearch={evidenceType?:"listing"|"specifications"|"review";checkedAt?:string;summary:string;tier:string;rating:string;sizingNote?:string;sizingSources?:{label:string;url:string}[];reviewScope?:string;reusedFromProductId?:number;sources:{label:string;url:string}[]};

// Records without an evidence type are the original, sourced review entries.
export const hasReview=(r:ProductResearch|undefined)=>!!r&&(!r.evidenceType||r.evidenceType==='review');
