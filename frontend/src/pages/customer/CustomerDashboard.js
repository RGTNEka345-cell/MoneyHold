
import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useCustomer} from '../../components/Customer/CustomerSessionProvider';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';
import './CustomerDashboard.css';
import ProfileEditor from '../../components/Customer/ProfileEditor';
import SavedAddresses from '../../components/Customer/SavedAddresses';
export default function CustomerDashboard(){
  const {customer,logout}=useCustomer();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const navigate=useNavigate();
  async function signOut(){setBusy(true);try{await logout();navigate('/login',{replace:true});}catch(e){setError(e.message);setBusy(false);}}
  return <div className="customer-account"><Navbar/><main><p className="eyebrow">YOUR MONEY HOLD ACCOUNT</p><h1>Welcome, {customer.firstName}.</h1><p>Your next favourite piece is waiting.</p><ProfileEditor key={customer.id}/><SavedAddresses key={customer.id}/><div className="customer-account-actions"><Link className="mh-action" to="/shop">Explore the collection ↗</Link><button disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'}</button></div>{error&&<p role="alert">{error}</p>}<p className="customer-account-note"><Link className="mh-action" to="/customer/cart">View your shopping bag →</Link> <Link className="mh-action" to="/customer/wishlist">My wishlist ♥</Link> <Link className="mh-action" to="/customer/orders">My orders →</Link></p></main><Footer/></div>;
}
