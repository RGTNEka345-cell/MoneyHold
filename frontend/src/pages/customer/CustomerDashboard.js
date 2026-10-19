
import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useCustomer} from '../../components/Customer/CustomerSessionProvider';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';
import './CustomerDashboard.css';
export default function CustomerDashboard(){
  const {customer,logout}=useCustomer();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const navigate=useNavigate();
  async function signOut(){setBusy(true);try{await logout();navigate('/login',{replace:true});}catch(e){setError(e.message);setBusy(false);}}
  return <div className="customer-account"><Navbar/><main><p className="eyebrow">YOUR MONEY HOLD ACCOUNT</p><h1>Welcome, {customer.firstName}.</h1><p>Your next favourite piece is waiting.</p><section><header><h2>Account details</h2><span>Email verified ✓</span></header><dl><dt>Name</dt><dd>{customer.firstName} {customer.lastName}</dd><dt>Email</dt><dd>{customer.email}</dd><dt>Phone</dt><dd>{customer.phone}</dd></dl></section><div className="customer-account-actions"><Link to="/shop">Explore the collection ↗</Link><button disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'}</button></div>{error&&<p role="alert">{error}</p>}<p className="customer-account-note"><Link to="/customer/cart">View your shopping bag →</Link> <Link to="/customer/orders">My orders →</Link></p></main><Footer/></div>;
}
