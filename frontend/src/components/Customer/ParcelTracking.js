import React from 'react';
import './ParcelTracking.css';
export default function ParcelTracking({order}){
  const tracking=order.tracking;
  if(!tracking)return null;
  let url;try{url=new URL(tracking.tracking_url);if(url.protocol!=='https:'||url.username||url.password)url=null;}catch{url=null;}
  return <section className="parcel-tracking" aria-label="Courier tracking"><div className="parcel-tracking-heading"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h11v12H3zM14 9h4l3 4v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg><div><span>COURIER TRACKING</span><h2>{tracking.courier_name}</h2></div></div><p className="parcel-reference">Tracking number <strong>{tracking.tracking_number}</strong></p>{order.status==='cancelled'?<p>This order was cancelled. Tracking details are retained for reference.</p>:url?<><a className="parcel-track-button" href={url.href} target="_blank" rel="noopener noreferrer">Track parcel <span aria-hidden="true">↗</span></a><small>Opens {url.hostname} in a new tab. Updates are provided by the courier.</small></>:<p>No tracking link has been added yet. Use the tracking number above when contacting the courier.</p>}</section>;
}
