import React, {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useCustomer} from './CustomerSessionProvider';
import {useCart} from './CartProvider';
import '../../pages/customer/Cart/Cart.css';

export default function AddToCart({variant}) {
  const {customer,loading}=useCustomer();
  const {add}=useCart();
  const location=useLocation();
  const [quantity,setQuantity]=useState(1);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [added,setAdded]=useState(false);
  async function submit(e) {
    e.preventDefault();setBusy(true);setError('');setAdded(false);
    try {await add(variant.id,Number(quantity));setAdded(true);}
    catch(err){setError(err.message);}finally{setBusy(false);}
  }
  if(loading)return <p role="status">Checking your account…</p>;
  if(!customer)return <div className="shop-purchase-note"><Link to="/login" state={{from:location.pathname}}>Sign in to add to your bag</Link><p>Select your favourite size and colour after signing in.</p></div>;
  return <form className="cart-add" onSubmit={submit}>
    <label>Quantity<input aria-label="Quantity" type="number" min="1" max={Math.min(variant?.stock||1,99)} step="1" required value={quantity} disabled={busy||!variant?.stock} onChange={e=>{setQuantity(e.target.value);setAdded(false);}}/></label>
    <button className="cart-primary" disabled={busy||!variant?.stock}>{busy?'Adding…':!variant?'Select a size':'Add to bag'}</button>
    {error&&<p role="alert">{error}</p>}
    {added&&<div className="cart-added-card">
      <div className="cart-added-message" role="status">
        <span className="cart-added-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        <div><strong>Added to your bag</strong><span>Your selection is saved and ready to review.</span></div>
      </div>
      <Link className="cart-view-bag" to="/customer/cart">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l1 12H4L5 8Z M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        View bag <span className="cart-view-arrow" aria-hidden="true">→</span>
      </Link>
    </div>}
    <small>Items are not reserved until checkout.</small>
  </form>;
}
