import React from 'react';
import {Navigate,Outlet,useLocation} from 'react-router-dom';
import {useCustomer} from '../Customer/CustomerSessionProvider';
export default function CustomerGuard(){
  const {customer,loading,error,refresh}=useCustomer();
  const location=useLocation();
  if(loading)return <main className="customer-access" role="status">Checking your account…</main>;
  if(error)return <main className="customer-access"><p role="alert">{error}</p><button onClick={refresh}>Try again</button></main>;
  if(!customer)return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  return <Outlet/>;
}
