import NotificationBell from '../../../components/Shared/NotificationBell';
import React,{useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import ThemeToggle from '../../../components/Theme/ThemeToggle';
import OrderDetails from '../../../components/Customer/OrderDetails';
import useOrders from '../../../hooks/useOrders';
import {sellerRequest} from '../../../services/sellerApi';
import {formatPrice} from '../../../hooks/useShop';
import '../SellerDashboard.css';
import '../../customer/Checkout/Checkout.css';
import './SellerOrders.css';
const transitions={placed:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
export default function SellerOrders(){
  const {id}=useParams();const [page,setPage]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState(''),[cancelConfirm,setCancelConfirm]=useState(false);
  const {data,loading,error:loadError,retry}=useOrders(id?'/orders/'+id:'/orders?page='+page,true);
  useEffect(()=>{setError('');setCancelConfirm(false);},[id,data?.order?.status]);
  async function update(status){
    setBusy(true);setError('');
    try{await sellerRequest('/orders/'+id+'/status',{status,expectedStatus:data.order.status},'PATCH');setCancelConfirm(false);retry();}
    catch(e){setError(e.message);retry();}finally{setBusy(false);}
  }
  return <div className="seller-workspace seller-orders"><aside className="seller-sidebar"><Link className="seller-logo" to="/">MONEY HOLD</Link><p>STORE MANAGEMENT</p><Link to="/seller/dashboard">Overview</Link><Link to="/seller/catalog">Products & stock</Link><Link to="/seller/orders" aria-current="page">Orders</Link><Link to="/">View storefront →</Link></aside><main className="seller-main"><header><div><span className="eyebrow">FULFILMENT / CASH ON DELIVERY</span><h1>{id?(data?.order.order_number||'Order details'):'Orders'}</h1><p>Review delivery details and keep your customers updated.</p></div><div style={{display:'flex',alignItems:'center',gap:16}}><NotificationBell seller/><ThemeToggle/></div></header>
    {id&&<Link className="seller-order-back" to="/seller/orders">← All orders</Link>}
    {(error||loadError)&&<div role="alert" className="seller-order-error">{error||loadError} <button onClick={retry}>Refresh</button></div>}
    {loading?<p role="status">Loading orders…</p>:id?data&&<><section className="seller-order-actions"><h2>Update fulfilment</h2><p>COD collection is handled by your courier. Delivery status does not record a payment settlement.</p><div>{(transitions[data.order.status]||[]).map(status=><button disabled={busy||!!loadError} key={status} onClick={()=>status==='cancelled'?setCancelConfirm(true):update(status)}>{status==='cancelled'?'Cancel order':'Mark '+status}</button>)}</div>{!(transitions[data.order.status]||[]).length&&<p>This order is {data.order.status}. No further status changes are available.</p>}{cancelConfirm&&<div role="alert"><p>Cancel this order? The ordered quantities will be returned to stock. This cannot be undone here.</p><button disabled={busy} onClick={()=>update('cancelled')}>Confirm cancellation</button><button disabled={busy} onClick={()=>setCancelConfirm(false)}>Keep order</button></div>}</section><OrderDetails order={data.order}/></>:data&&<><div className="order-list">{data.orders.map(order=><Link key={order.id} to={'/seller/orders/'+order.id}><div><strong>{order.order_number}</strong><span>{order.recipient_name} · {new Date(order.created_at).toLocaleDateString()}</span></div><span className={'order-badge '+order.status}>{order.status}</span><strong>{formatPrice(order.total_cents/100)}</strong><span aria-hidden="true">→</span></Link>)}{!data.orders.length&&<p>No orders yet. New customer orders will appear here automatically.</p>}</div><nav className="order-pagination" aria-label="Order pages"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)}>Next</button></nav></>}
  </main></div>;
}
