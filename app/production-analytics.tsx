'use client';

import {useEffect} from 'react';

const beaconUrl='https://static.cloudflareinsights.com/beacon.min.js';
const productionOrigin='https://bcremixed.ispithotfire.com';
const token=process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;

export function ProductionAnalytics(){
  useEffect(()=>{
    // Pages previews share the build output but must not report visitor traffic.
    if(location.origin!==productionOrigin||!token||!/^[a-f0-9]{32}$/.test(token))return;
    // Keep one beacon while the Pages-managed tag is being retired.
    if(document.querySelector(`script[src="${beaconUrl}"]`))return;
    const script=document.createElement('script');
    script.src=beaconUrl;
    script.defer=true;
    script.dataset.cfBeacon=JSON.stringify({token});
    document.head.appendChild(script);
  },[]);
  return null;
}
