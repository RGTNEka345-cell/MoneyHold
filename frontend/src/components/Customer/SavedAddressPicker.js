import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import useAccountData from '../../hooks/useAccountData';
import './CustomerProfile.css';
export default function SavedAddressPicker({onSelect,canAutofill,disabled}){
  const {data,loading,error,refresh}=useAccountData('/addresses');
  const [selection,setSelection]=useState(null);const attempted=useRef(false);
  const addresses=data?.addresses||[];
  useEffect(()=>{
    if(!data||attempted.current)return;
    attempted.current=true;
    const address=data.addresses.find(a=>a.isDefault);
    if(address&&canAutofill()){setSelection({id:address.id,version:address.version});onSelect(address);}
  },[data,canAutofill,onSelect]);
  const current=addresses.find(a=>a.id===selection?.id);
  const stale=!!selection&&(!current||current.version!==selection.version);
  return <div className="checkout-saved-address"><label>Saved delivery address<select disabled={disabled||loading} value={selection?.id||''} onChange={e=>{const address=addresses.find(a=>a.id===Number(e.target.value));setSelection(address?{id:address.id,version:address.version}:null);onSelect(address||null);}}><option value="">Enter address manually</option>{addresses.map(address=><option key={address.id} value={address.id}>{address.label}{address.isDefault?' (default)':''} — {address.city}</option>)}</select></label><small>You can edit the delivery fields below for this order without changing your saved address.</small>{loading&&<p role="status">Loading saved addresses…</p>}{error&&<p role="alert">Saved addresses could not be loaded. You can still enter delivery details manually. <button type="button" disabled={disabled} onClick={refresh}>Retry</button></p>}{stale&&!error&&<p role="status">This saved address changed elsewhere. Your current delivery fields have not changed.{current&&<button type="button" disabled={disabled} onClick={()=>{setSelection({id:current.id,version:current.version});onSelect(current);}}>Use updated address</button>}</p>}<Link className="mh-action" to="/customer/account">Manage saved addresses</Link></div>;
}
