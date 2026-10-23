import ReturnsPanel from '../../../components/Customer/ReturnsPanel';
import React,{useState} from 'react';
import {Link,useLocation,useParams} from 'react-router-dom';
import Navbar from '../../../components/HomePage/Navbar';
import Footer from '../../../components/HomePage/Footer';
import OrderDetails from '../../../components/Customer/OrderDetails';
import useOrders from '../../../hooks/useOrders';
import {formatPrice} from '../../../hooks/useShop';
import '../Cart/Cart.css';
import '../Checkout/Checkout.css';
export default function Orders(){
  const {id}=useParams(),location=useLocation();
  const [page,setPage]=useState(1);
  const {data,loading,error,retry}=useOrders(id?'/orders/'+id:'/orders?page='+page);
  return <div className="cart-page"><Navbar/><main className="cart-main"><Link className="cart-continue-shopping" to={id?'/customer/orders':'/shop'}>{id?'← All orders':'Continue shopping →'}</Link><header className="cart-heading"><p>MONEY HOLD / MY ORDERS</p><h1>{id?(data?.order.order_number||'Order details'):'Your orders.'}</h1></header>
    {id&&location.state?.placed&&<div className="order-confirmation" role="status"><strong>Thank you. Your order has been placed.</strong><p>Pay on delivery. You can track the latest status here.</p></div>}
    {error&&<div role="alert" className="cart-warning">{error} <button onClick={retry}>Retry</button></div>}
    {loading?<p role="status">Loading orders…</p>:id?data&&<><OrderDetails order={data.order}/><ReturnsPanel key={data.order.id} order={data.order} onChange={retry}/></>:data&&<><div className="order-list">{data.orders.map(order=><Link to={'/customer/orders/'+order.id} key={order.id}><div><strong>{order.order_number}</strong><span>{new Date(order.created_at).toLocaleDateString()}</span></div><span className={'order-badge '+order.status}>{order.status}</span><strong>{formatPrice(order.total_cents/100)}</strong><span aria-hidden="true">→</span></Link>)}{!data.orders.length&&<div className="checkout-panel"><h2>No orders yet.</h2><p>Your first order will appear here after checkout.</p><Link className="cart-primary" to="/shop">Explore the collection</Link></div>}</div><nav className="order-pagination" aria-label="Order pages"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)}>Next</button></nav></>}
  </main><Footer/></div>;
}
