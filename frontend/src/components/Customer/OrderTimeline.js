import React from 'react';
import './OrderTimeline.css';

const steps=[
  {status:'placed',label:'Order placed',description:'Your order has been received.'},
  {status:'processing',label:'Preparing',description:'Your pieces are being prepared.'},
  {status:'shipped',label:'Shipped',description:'Your parcel has been marked as shipped.'},
  {status:'delivered',label:'Delivered',description:'Delivery has been marked complete.'}
];
const paths={
  placed:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 5 2 2 4-4"/></>,
  processing:<><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10M7 5.8l9 5"/></>,
  shipped:<><path d="M3 5h11v12H3zM14 9h4l3 4v4h-7M18 9v4h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
  delivered:<><path d="m3 11 9-8 9 8M5 10v11h14V10m-10 5 2 2 4-4"/></>,
  cancelled:<><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>
};
function Timestamp({value}){
  const date=value?new Date(value):null;
  if(!date||Number.isNaN(date.getTime()))return <span className="tracking-date">Date unavailable</span>;
  return <time className="tracking-date" dateTime={date.toISOString()}>{date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}<span>{date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></time>;
}
export default function OrderTimeline({order}){
  const history=order.history||[];
  const cancelled=order.status==='cancelled';
  const currentIndex=steps.findIndex(step=>step.status===order.status);
  const current=steps[currentIndex];
  const display=cancelled?[...steps.filter(step=>step.status==='placed'||history.some(event=>event.status===step.status)),{status:'cancelled',label:'Cancelled',description:'This order will not continue to delivery.'}]:steps;
  const title=cancelled?'Order cancelled':current?.label||'Order update';
  return <section className={'order-tracker'+(cancelled?' tracking-cancelled':'')} aria-label="Order timeline">
    <header className="tracking-header"><div><span className="tracking-eyebrow">YOUR ORDER JOURNEY</span><h2>{title}</h2><p>{cancelled?'The journey ended here.':current?.description||'Check the recorded updates below.'}</p></div><span className="tracking-summary">{cancelled?'Cancelled':currentIndex===3?'Journey complete':currentIndex>=0?`Step ${currentIndex+1} of 4`:'Awaiting update'}</span></header>
    <ol className="tracking-steps" style={{'--tracking-columns':display.length}}>{display.map(step=>{
      const event=[...history].reverse().find(entry=>entry.status===step.status);
      const isCurrent=order.status===step.status;
      const reached=!!event||step.status==='placed'||(!cancelled&&steps.findIndex(s=>s.status===step.status)<currentIndex);
      const state=isCurrent?'current':reached?'complete':'pending';
      const stamp=event?.created_at||(step.status==='placed'?order.created_at:null);
      return <li key={step.status} className={'tracking-step '+state} aria-current={isCurrent?'step':undefined}>
        <div className="tracking-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[step.status]}</svg>{state==='complete'&&<span className="tracking-check">✓</span>}</div>
        <div className="tracking-copy"><span className="tracking-state">{step.status==='cancelled'?'Stopped':step.status==='delivered'&&isCurrent?'Complete':isCurrent?'Current status':reached?'Completed':'Upcoming'}</span><h3>{step.label}</h3>{reached||isCurrent?<Timestamp value={stamp}/>:<span className="tracking-date">Awaiting update</span>}</div>
      </li>;
    })}</ol>
    <p className="tracking-footnote">Status updates are recorded by Money Hold. This is not live courier location tracking.</p>
  </section>;
}
