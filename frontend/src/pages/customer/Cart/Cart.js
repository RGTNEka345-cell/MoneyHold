import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import Navbar from '../../../components/HomePage/Navbar';
import Footer from '../../../components/HomePage/Footer';
import {useCart} from '../../../components/Customer/CartProvider';
import {shopImage,formatPrice} from '../../../hooks/useShop';
import './Cart.css';

function CartItem({item,update,remove}) {
  const [quantity,setQuantity]=useState(item.quantity);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>setQuantity(item.quantity),[item.quantity]);
  async function act(action){setBusy(true);setError('');try{await action();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <article className="cart-item">
    <Link to={'/shop/'+item.product_id} className="cart-photo">{item.image_id?<img src={shopImage(item.image_id)} alt={item.name}/>:<span>No photo</span>}</Link>
    <div className="cart-item-copy"><Link to={'/shop/'+item.product_id}><h2>{item.name}</h2></Link><p>{item.colour} / {item.size}</p><p>{formatPrice(item.priceCents/100)} each</p>
      {item.issue&&<p className="cart-warning" role="status">{item.issue}</p>}
      <form className="cart-quantity" onSubmit={e=>{e.preventDefault();act(()=>update(item.id,Number(quantity)));}}>
        <label>Quantity<input aria-label={'Quantity for '+item.name+' '+item.size+' '+item.colour} type="number" min="1" max={Math.min(item.stock||1,99)} step="1" required value={quantity} disabled={busy||!item.is_active||!item.stock} onChange={e=>setQuantity(e.target.value)}/></label>
        <button disabled={busy||!item.is_active||!item.stock||Number(quantity)===item.quantity}>Update</button>
        <button type="button" disabled={busy} onClick={()=>act(()=>remove(item.id))}>Remove</button>
      </form>{busy&&<small role="status">Updating bag…</small>}{error&&<p role="alert">{error}</p>}
    </div><strong className="cart-line-price">{formatPrice(item.lineTotalCents/100)}</strong>
  </article>;
}
export default function Cart(){
  const {cart,loading,error,refresh,update,remove}=useCart();
  return <div className="cart-page"><Navbar/><main className="cart-main"><Link className="cart-continue-shopping" to="/shop"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>Continue shopping</Link><header className="cart-heading"><p>MONEY HOLD / YOUR SELECTION</p><h1>Your shopping bag<span>{cart.count} items</span></h1></header>
    {error&&<div role="alert" className="cart-warning">{error} <button onClick={refresh}>Try again</button></div>}
    {loading?<p role="status">Loading your bag…</p>:!cart.items.length?<section className="cart-empty"><h2>{error?'Your bag is unavailable':'Make room for your next favourite.'}</h2><p>{error?'Please retry to load your saved items.':'Your bag is empty. Find a piece that feels like you.'}</p><Link className="cart-primary" to="/shop">Explore the collection →</Link></section>:<div className="cart-layout"><section aria-label="Bag items">{cart.items.map(item=><CartItem key={item.id} item={item} update={update} remove={remove}/>)}</section><aside className="cart-summary"><p className="cart-summary-kicker">THE DETAILS</p><h2>Bag summary</h2><div><span>Items ({cart.count})</span><strong>{formatPrice(cart.subtotalCents/100)}</strong></div><p>Estimated subtotal. Delivery charges will be calculated at checkout.</p>{cart.hasUnavailableItems&&<p className="cart-warning">Some items are unavailable or exceed current stock. Update or remove them. The estimate includes all listed items.</p>}{cart.hasUnavailableItems||error?<button className="cart-primary" disabled>Update bag to continue</button>:<Link className="cart-primary" to="/customer/checkout">Proceed to checkout →</Link>}<p>Cash on Delivery available. Review delivery details and the final total at checkout.</p><small>Prices and stock update automatically. Adding to your bag does not reserve stock.</small></aside></div>}
  </main><Footer/></div>;
}
