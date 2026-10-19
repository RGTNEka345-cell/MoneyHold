import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {customerRequest} from '../../services/customerApi';
import {sellerRequest} from '../../services/sellerApi';
import './NotificationBell.css';
export default function NotificationBell({seller=false}){
  const [data,setData]=useState({items:[],unread:0,pages:1}),[open,setOpen]=useState(false),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[busy,setBusy]=useState(null);
  const root=useRef(null),trigger=useRef(null),sequence=useRef(0);
  const request=seller?sellerRequest:customerRequest;
  useEffect(()=>{
    let active=true;setLoading(true);
    const refresh=async()=>{const seq=++sequence.current;try{const result=await request('/notifications?page='+page);if(active&&seq===sequence.current){setData(result);setLoading(false);setError('');}}catch(e){if(active&&seq===sequence.current){if([401,403].includes(e.status))setData({items:[],unread:0,pages:1});setLoading(false);setError(e.message);}}};
    refresh();const stream=new EventSource((process.env.REACT_APP_API_URL||'http://localhost:5000/api')+(seller?'/seller':'/customer')+'/notifications/events',{withCredentials:true});stream.onmessage=refresh;
    window.addEventListener('focus',refresh);
    return()=>{active=false;sequence.current++;stream.close();window.removeEventListener('focus',refresh);};
  },[request,seller,page,retry]);
  useEffect(()=>{
    if(!open)return;
    const outside=e=>{if(!root.current?.contains(e.target))setOpen(false);};
    const escape=e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  async function read(id){setBusy(id);try{await request('/notifications/'+id+'/read',{},'PATCH');setRetry(x=>x+1);}catch(e){setError(e.message);}finally{setBusy(null);}}
  return <div ref={root} className={'notification-bell '+(seller?'seller-notifications':'')}><button ref={trigger} type="button" className="notification-trigger" aria-label={'Notifications, '+data.unread+' unread'} aria-expanded={open} onClick={()=>setOpen(x=>!x)}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>{data.unread>0&&<span className="notification-count">{data.unread>99?'99+':data.unread}</span>}</button>
    {open&&<section className="notification-panel" aria-label="Notifications"><header><div><h2>Notifications</h2><p>{data.unread} unread updates</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close notifications">×</button></header>
      {error&&<p role="alert">{error} <button onClick={()=>setRetry(x=>x+1)}>Retry</button></p>}{loading?<p role="status">Loading notifications…</p>:<ul>{data.items.map(item=><li key={item.id} className={item.read_at?'':'notification-unread'}><Link to={(seller?'/seller':'/customer')+'/orders/'+item.order_id} onClick={()=>{setOpen(false);}}>{item.message}<time>{new Date(item.created_at).toLocaleString()}</time></Link>{!item.read_at&&<button type="button" disabled={busy===item.id} onClick={()=>read(item.id)}>{busy===item.id?'Saving…':'Mark as read'}</button>}</li>)}{!data.items.length&&!error&&<li>You’re all caught up. Order updates will appear here.</li>}</ul>}
      <footer><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{page} / {data.pages}</span><button disabled={page>=data.pages||loading} onClick={()=>setPage(p=>p+1)}>Next</button></footer>
    </section>}
  </div>;
}
