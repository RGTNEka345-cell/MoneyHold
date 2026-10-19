import React from 'react';
import {formatPrice} from '../../hooks/useShop';
import OrderTimeline from './OrderTimeline';
import ParcelTracking from './ParcelTracking';
export default function OrderDetails({order}){
  return <><div className="order-facts"><span className={'order-badge '+order.status}>{order.status}</span><span>Cash on Delivery · LKR</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
    <OrderTimeline order={order}/>
    <ParcelTracking order={order}/>
    <div className="checkout-layout"><section className="checkout-panel"><h2>Ordered items</h2><ul className="order-lines">{order.items.map(item=><li key={item.id}><div><strong>{item.product_name}</strong><span>{item.size} / {item.colour} · Qty {item.quantity}</span><span>{formatPrice(item.unit_price_cents/100)} each</span></div><b>{formatPrice(item.line_total_cents/100)}</b></li>)}</ul><div className="checkout-total"><span>Subtotal</span><strong>{formatPrice(order.subtotal_cents/100)}</strong></div><div className="checkout-total"><span>Delivery</span><strong>{formatPrice(order.delivery_cents/100)}</strong></div><div className="checkout-total checkout-grand"><span>Total</span><strong>{formatPrice(order.total_cents/100)}</strong></div></section>
    <aside className="checkout-panel"><h2>Delivery to</h2><address>{order.recipient_name}<br/>{order.phone}<br/>{order.address_line1}<br/>{order.address_line2&&<>{order.address_line2}<br/></>}{order.city} {order.postal_code}<br/>Sri Lanka</address></aside></div></>;
}
