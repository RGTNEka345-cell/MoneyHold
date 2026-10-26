import React,{useState} from 'react';
import {customerRequest} from '../../services/customerApi';
import {useCustomer} from './CustomerSessionProvider';
import useAccountData from '../../hooks/useAccountData';
import './CustomerProfile.css';
function Editor({data,refresh}){
  const {accept}=useCustomer();
  const [form,setForm]=useState({firstName:data.customer.firstName,lastName:data.customer.lastName,phone:data.customer.phone,version:data.version});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const stale=form.version!==data.version;
  function reload(){setForm({firstName:data.customer.firstName,lastName:data.customer.lastName,phone:data.customer.phone,version:data.version});setError('');setSaved(false);}
  async function submit(e){e.preventDefault();if(busy||stale)return;setBusy(true);setError('');setSaved(false);try{const result=await customerRequest('/profile',form,'PATCH');accept(result.customer);await refresh();setForm({...form,firstName:result.customer.firstName,lastName:result.customer.lastName,phone:result.customer.phone,version:result.version});setSaved(true);}catch(err){setError(err.message);if(err.status===409)await refresh();}finally{setBusy(false);}}
  return <form onSubmit={submit} className="profile-form"><fieldset disabled={busy||stale}><div className="profile-form-grid">{[['firstName','First name','given-name'],['lastName','Last name','family-name'],['phone','Phone number','tel']].map(([name,label,autoComplete])=><label key={name}>{label}<input required minLength={name==='phone'?8:2} maxLength={name==='phone'?20:60} type={name==='phone'?'tel':'text'} autoComplete={autoComplete} value={form[name]} onChange={e=>{setForm({...form,[name]:e.target.value});setSaved(false);}}/></label>)}<label>Verified email<input type="email" value={data.customer.email} readOnly/><small>Your login email cannot be changed here.</small></label></div><button className="profile-primary">{busy?'Saving…':'Save profile'}</button></fieldset>{stale&&<p role="alert">Your profile was updated elsewhere. Your unsaved input has been kept. <button type="button" onClick={reload}>Load latest profile</button></p>}{error&&<p role="alert">{error}</p>}{saved&&<p role="status" className="profile-success">Profile saved.</p>}</form>;
}
export default function ProfileEditor(){
  const {data,loading,error,refresh}=useAccountData('/profile');
  return <section className="account-profile"><header><h2>Personal details</h2><span>Email verified ✓</span></header><p className="profile-hint">Keep your contact details up to date. Saved delivery addresses are managed separately below.</p>{error&&<p role="alert">{error} <button onClick={refresh}>Retry</button></p>}{loading?<p role="status">Loading profile…</p>:data&&<Editor data={data} refresh={refresh}/>}</section>;
}
