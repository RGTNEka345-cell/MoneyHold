import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import Navbar from '../../../components/HomePage/Navbar';
import Footer from '../../../components/HomePage/Footer';
import {useCustomer} from '../../../components/Customer/CustomerSessionProvider';
import {useCart} from '../../../components/Customer/CartProvider';
import {customerRequest,watchCart} from '../../../services/customerApi';
import {formatPrice} from '../../../hooks/useShop';
import '../Cart/Cart.css';
import './Checkout.css';
import SavedAddressPicker from '../../../components/Customer/SavedAddressPicker';

export default function Checkout(){
  const {customer}=useCustomer();
  const {refresh:refreshCart}=useCart();
  const navigate=useNavigate();
  const [delivery,setDelivery]=useState({name:[customer.firstName,customer.lastName].filter(Boolean).join(' '),phone:customer.phone||'',addressLine1:'',addressLine2:'',city:'',postalCode:'',country:'LK'});
  const [quote,setQuote]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[changed,setChanged]=useState(false);
  const inFlight=useRef(false),key=useRef(null),previousQuote=useRef(null);
  const storageKey='moneyHoldCheckout:'+customer.id;
  const deliveryTouched=useRef(false);
  const canAutofill=useCallback(()=>!deliveryTouched.current&&!inFlight.current,[]);
  const selectAddress=useCallback(address=>{
    deliveryTouched.current=true;
    setDelivery(address?{name:address.name,phone:address.phone,addressLine1:address.addressLine1,addressLine2:address.addressLine2,city:address.city,postalCode:address.postalCode,country:address.country}:{name:[customer.firstName,customer.lastName].filter(Boolean).join(' '),phone:customer.phone||'',addressLine1:'',addressLine2:'',city:'',postalCode:'',country:'LK'});
  },[customer.firstName,customer.lastName,customer.phone]);
  useEffect(()=>{
    let active=true,sequence=0,recovered=false;
    setLoading(true);setQuote(null);
    const refresh=async()=>{
      if(inFlight.current||!recovered)return;
      const request=++sequence;
      try{
        const result=await customerRequest('/orders/quote');
        if(active&&request===sequence&&!inFlight.current){
          if(previousQuote.current&&previousQuote.current!==result.quoteToken)setChanged(true);
          previousQuote.current=result.quoteToken;setQuote(result);setLoading(false);setError('');
        }
      }catch(e){if(active&&request===sequence&&!inFlight.current){setQuote(null);setError(e.message);setLoading(false);}}
    };
    async function start(){
      // Recover a committed order when the previous response was lost or the page reloaded.
      try{key.current=sessionStorage.getItem(storageKey)||key.current;}catch{}
      if(key.current){
        try{
          const result=await customerRequest('/orders/request/'+key.current);
          if(active){try{sessionStorage.removeItem(storageKey);}catch{}navigate('/customer/orders/'+result.id,{replace:true});}return;
        }catch(e){if(e.status!==404){if(active){setError('Unable to check your previous checkout. Retry before placing another order.');setLoading(false);}return;}}
      }
      if(active){recovered=true;refresh();}
    }
    start();const stop=watchCart(refresh);window.addEventListener('focus',refresh);
    return()=>{active=false;sequence++;stop();window.removeEventListener('focus',refresh);};
  },[navigate,retry,storageKey]);
  async function submit(e){
    e.preventDefault();if(inFlight.current||!quote||changed)return;
    inFlight.current=true;setBusy(true);setError('');
    if(!key.current)key.current=Array.from(window.crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
    try{sessionStorage.setItem(storageKey,key.current);}catch{}
    try{
      const result=await customerRequest('/orders',{requestKey:key.current,quoteToken:quote.quoteToken,paymentMethod:'cod',delivery});
      try{sessionStorage.removeItem(storageKey);}catch{}
      refreshCart();navigate('/customer/orders/'+result.id,{replace:true,state:{placed:true}});
    }catch(err){
      // Resolve ambiguous failures before permitting a new checkout attempt.
      try{
        const existing=await customerRequest('/orders/request/'+key.current);
        try{sessionStorage.removeItem(storageKey);}catch{}
        refreshCart();navigate('/customer/orders/'+existing.id,{replace:true,state:{placed:true}});return;
      }catch{}
      setError(err.message);
      if([409,422,503].includes(err.status)){setQuote(null);}
    }finally{inFlight.current=false;setBusy(false);}
  }
  const fields=[['name','Full name',120,'name',true],['phone','Phone number',30,'tel',true],['addressLine1','Street address',200,'address-line1',true],['addressLine2','Apartment / landmark (optional)',200,'address-line2',false],['city','City',100,'address-level2',true],['postalCode','Postal code (optional)',20,'postal-code',false]];
  return <div className="cart-page"><Navbar/><main className="cart-main checkout-main"><Link className="cart-continue-shopping" to="/customer/cart">← Back to bag</Link><header className="cart-heading"><p>MONEY HOLD / CHECKOUT</p><h1>The final details.</h1><p>Delivery within Sri Lanka · Cash on Delivery</p></header>
    {error&&<div role="alert" className="cart-warning">{error} <button type="button" disabled={busy} onClick={()=>setRetry(x=>x+1)}>Retry / refresh summary</button> <Link className="mh-action" to="/customer/orders">Check My Orders</Link></div>}
    {loading?<p role="status">Preparing your order…</p>:<form className="checkout-layout" onSubmit={submit}><section className="checkout-panel"><h2>01 / Delivery details</h2><p>Use a reachable phone number so the courier can contact you.</p><SavedAddressPicker onSelect={selectAddress} canAutofill={canAutofill} disabled={busy}/><fieldset disabled={busy} className="checkout-fields" onChange={()=>{deliveryTouched.current=true;}}>{fields.map(([name,label,maxLength,autoComplete,required])=><label key={name}>{label}<input name={name} value={delivery[name]} maxLength={maxLength} autoComplete={autoComplete} required={required} type={name==='phone'?'tel':'text'} onChange={e=>setDelivery({...delivery,[name]:e.target.value})}/></label>)}<label>Country<input value="Sri Lanka" disabled/></label></fieldset><h2>02 / Payment</h2><div className="checkout-payment"><strong>Cash on Delivery</strong><p>Pay the full order total to the courier when your parcel arrives. No online payment is collected.</p></div></section>
      <aside className="checkout-panel checkout-review"><h2>Your order</h2>{quote?<><ul>{quote.items.map(item=><li key={item.variant_id}><div><strong>{item.name}</strong><span>{item.size} / {item.colour} · Qty {item.quantity}</span></div><b>{formatPrice(item.lineTotalCents/100)}</b></li>)}</ul><div className="checkout-total"><span>Subtotal</span><strong>{formatPrice(quote.subtotalCents/100)}</strong></div><div className="checkout-total"><span>Delivery</span><strong>{formatPrice(quote.deliveryCents/100)}</strong></div><div className="checkout-total checkout-grand"><span>Total (LKR)</span><strong>{formatPrice(quote.totalCents/100)}</strong></div></>:<p>Review an available order summary before placing your order.</p>}
      {changed&&<div className="cart-warning" role="status">Your bag or price changed. Review the new total.<button type="button" onClick={()=>setChanged(false)}>I have reviewed the updated summary</button></div>}
      <button className="cart-primary" disabled={busy||!quote||changed}>{busy?'Placing your order…':'Place order · Pay on delivery'}</button><small>Stock is confirmed when you place the order. Please avoid opening another checkout while this request is processing.</small></aside>
    </form>}
  </main><Footer/></div>;
}
