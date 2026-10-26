import React,{createContext,useContext,useCallback,useEffect,useRef,useState} from 'react';
import {customerRequest,watchAccount} from '../../services/customerApi';
const Context=createContext({customer:null,loading:false,error:''});
export const useCustomer=()=>useContext(Context);
export default function CustomerSessionProvider({children}){
  const [state,setState]=useState({customer:null,loading:true,error:''});
  const generation=useRef(0);
  const refresh=useCallback(async()=>{
    const current=++generation.current;
    try{const data=await customerRequest('/me');if(current===generation.current)setState({customer:data.customer,loading:false,error:''});}
    catch(e){if(current===generation.current)setState({customer:null,loading:false,error:e.status===401?'':e.message});}
  },[]);
  useEffect(()=>{
    try{localStorage.removeItem('moneyHoldToken');localStorage.removeItem('moneyHoldCustomer');}catch{}
    refresh();window.addEventListener('focus',refresh);
    const timer=setInterval(refresh,60000);
    return()=>{generation.current++;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[refresh]);
  const accept=customer=>{generation.current++;setState({customer,loading:false,error:''});};
  useEffect(()=>{if(!state.customer?.id)return;return watchAccount(refresh);},[state.customer?.id,refresh]);
  async function logout(){await customerRequest('/logout',{});accept(null);}
  return <Context.Provider value={{...state,refresh,accept,logout}}>{children}</Context.Provider>;
}
