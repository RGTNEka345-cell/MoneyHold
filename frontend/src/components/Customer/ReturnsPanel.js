import React,{useRef,useState} from 'react';
import {customerRequest} from '../../services/customerApi';
import {sellerRequest} from '../../services/sellerApi';
import ParcelTracking from './ParcelTracking';
import './ReturnsPanel.css';
const labels={requested:'Requested',approved:'Approved — awaiting return parcel',rejected:'Rejected',received:'Received & inspected',dispatched:'Replacement dispatched',completed:'Closed'};
function SellerAction({request,orderId,onChange}){
  const actions={requested:['approved','rejected'],approved:['received'],received:request.kind==='exchange'?['dispatched']:['completed'],dispatched:['completed']}[request.status]||[];
  const [action,setAction]=useState(actions[0]||''),[note,setNote]=useState(''),[restock,setRestock]=useState('0'),[confirmed,setConfirmed]=useState(false),[tracking,setTracking]=useState({courierName:'',trackingNumber:'',trackingUrl:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  if(!actions.length)return null;
  async function submit(e){e.preventDefault();if(busy)return;setBusy(true);setError('');try{await sellerRequest(`/orders/${orderId}/returns/${request.id}`,{status:action,version:request.version,note,restockQuantity:Number(restock),inspected:confirmed,confirmed,tracking},'PATCH');onChange();}catch(err){setError(err.message);}finally{setBusy(false);}}
  return <form className="return-action" onSubmit={submit}><fieldset disabled={busy}><label>Next action<select value={action} onChange={e=>{setAction(e.target.value);setConfirmed(false);}}>{actions.map(status=><option key={status} value={status}>{labels[status]}</option>)}</select></label><label>{action==='approved'?'Return address & instructions for the customer':'Customer-visible note'}<textarea required maxLength={1000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Explain the decision or next steps."/></label>
    {action==='received'&&<><label>Resellable units to add back to stock<input type="number" required min="0" max={request.quantity} step="1" value={restock} onChange={e=>setRestock(e.target.value)}/></label><label className="return-check"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I physically received and inspected the full returned quantity. Only the resellable units above will be restocked.</label></>}
    {action==='dispatched'&&<><p>Replacement stock is checked and deducted when you confirm dispatch.</p>{[['courierName','Replacement courier'],['trackingNumber','Replacement tracking number'],['trackingUrl','Replacement tracking URL (optional)']].map(([name,label])=><label key={name}>{label}<input required={name!=='trackingUrl'} type={name==='trackingUrl'?'url':'text'} maxLength={name==='trackingUrl'?1000:name==='courierName'?100:120} value={tracking[name]} onChange={e=>setTracking({...tracking,[name]:e.target.value})}/></label>)}</>}
    {action==='completed'&&<label className="return-check"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{request.kind==='exchange'?'I have confirmed replacement delivery.':'Close this return. I understand this does not issue or confirm a refund.'}</label>}
    <button className="return-primary" type="submit">{busy?'Saving…':'Confirm update'}</button></fieldset>{error&&<p role="alert">{error} <button type="button" onClick={onChange}>Reload latest</button></p>}</form>;
}
function CustomerForm({order,onChange}){
  const requests=order.returns?.requests||[],options=order.returns?.options||[];
  const available=(order.items||[]).map(item=>({...item,remaining:item.quantity-requests.filter(r=>r.order_item_id===item.id&&!['rejected','cancelled'].includes(r.status)).reduce((sum,r)=>sum+r.quantity,0)})).filter(item=>item.remaining>0);
  const [itemId,setItemId]=useState(''),[kind,setKind]=useState('return'),[quantity,setQuantity]=useState(1),[replacement,setReplacement]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const key=useRef(null);
  const item=available.find(i=>i.id===Number(itemId));
  if(order.status!=='delivered')return <p>You can request a return or size exchange after delivery.</p>;
  if(!available.length)return <p>All delivered units already have a return or exchange request.</p>;
  async function submit(e){e.preventDefault();if(busy)return;setBusy(true);setError('');try{
    if(!key.current)key.current=Array.from(window.crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
    await customerRequest('/orders/'+order.id+'/returns',{itemId:Number(itemId),kind,quantity:Number(quantity),replacementVariantId:kind==='exchange'?Number(replacement):null,reason,requestKey:key.current});key.current=null;onChange();
  }catch(err){setError(err.message);}finally{setBusy(false);}}
  return <form className="return-customer-form" onSubmit={submit} onChange={()=>{key.current=null;}}><fieldset disabled={busy}><label>Delivered item<select required value={itemId} onChange={e=>{setItemId(e.target.value);setQuantity(1);setReplacement('');}}><option value="">Choose an item</option>{available.map(i=><option key={i.id} value={i.id}>{i.product_name} · {i.size} / {i.colour} ({i.remaining} eligible)</option>)}</select></label><div className="return-form-row"><label>Request type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="return">Return</option><option value="exchange">Size exchange</option></select></label><label>Quantity<input type="number" required min="1" max={item?.remaining||1} step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></div>
    {kind==='exchange'&&<label>Replacement size — same product & colour<select required value={replacement} onChange={e=>setReplacement(e.target.value)}><option value="">Choose another size</option>{options.filter(o=>o.order_item_id===Number(itemId)).map(o=><option key={o.id} value={o.id} disabled={o.stock<Number(quantity)}>{o.size} ({o.stock} available)</option>)}</select><small>Stock is not reserved. Availability is checked again when the replacement is dispatched.</small></label>}
    <label>Reason<textarea required minLength={1} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Tell us about the fit or the reason for your return."/></label><button className="return-primary" disabled={!item}>{busy?'Submitting…':'Submit request'}</button></fieldset>{error&&<p role="alert">{error} <button type="button" onClick={onChange}>Reload order</button></p>}</form>;
}
export default function ReturnsPanel({order,seller=false,onChange=()=>{}}){
  const requests=order.returns?.requests||[];
  return <section className="returns-panel" aria-label="Returns and size exchanges"><header><span>AFTER YOUR DELIVERY</span><h2>Returns & size exchanges</h2><p>Requests are reviewed by the store. Wait for approval and return instructions before sending your parcel. Refunds and shipping costs are arranged separately; closing a request does not confirm a refund.</p></header>
    {!seller&&<CustomerForm order={order} onChange={onChange}/>}
    {seller&&!requests.length&&<p>No return or exchange requests for this order.</p>}
    <div className="return-requests">{requests.map(request=>{
      const item=order.items.find(i=>i.id===request.order_item_id);
      return <article key={request.id} className="return-card"><div className="return-card-heading"><h3>{request.kind==='exchange'?'Size exchange':'Return'} #{request.id}</h3><span className={'return-status '+request.status}>{labels[request.status]||request.status}</span></div><p><strong>{item?.product_name||'Ordered item'}</strong> · {item?.size} / {item?.colour} · Qty {request.quantity}{request.replacement_size&&<> → Size {request.replacement_size}</>}</p><p className="return-note">Reason: {request.reason}</p>{request.seller_note&&<div className="return-instructions"><strong>Store update / instructions</strong><p>{request.seller_note}</p></div>}{request.restock_quantity!=null&&<p>Inspection recorded: {request.restock_quantity} of {request.quantity} units restocked.</p>}
      {request.tracking_number&&<ParcelTracking order={{status:'shipped',tracking:{courier_name:request.courier_name,tracking_number:request.tracking_number,tracking_url:request.tracking_url}}}/>}
      <details><summary>Request history</summary><ol>{request.history?.map((entry,index)=><li key={index}><strong>{labels[entry.status]||entry.status}</strong> · {new Date(entry.created_at).toLocaleString()}<p className="return-note">{entry.note}</p></li>)}</ol></details>
      {seller&&<SellerAction key={request.id+':'+request.version} request={request} orderId={order.id} onChange={onChange}/>}</article>;
    })}</div>
  </section>;
}
