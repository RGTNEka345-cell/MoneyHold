import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {useCustomer} from './CustomerSessionProvider';
import {customerRequest,watchCart} from '../../services/customerApi';
const empty={items:[],count:0,subtotalCents:0,hasUnavailableItems:false};
const Context=createContext({cart:empty,loading:false,error:''});
export const useCart=()=>useContext(Context);
export default function CartProvider({children}){
  const {customer,refresh:refreshCustomer}=useCustomer();
  const [state,setState]=useState({owner:null,cart:empty,loading:false,error:''});
  const identity=customer?.id;
  const current=useRef(identity);current.current=identity;
  const sequence=useRef(0);
  const refreshRef=useRef(()=>{});
  useEffect(()=>{
    let active=true;
    async function refresh(){
      if(!identity)return;
      const request=++sequence.current;
      try{const cart=await customerRequest('/cart');if(active&&current.current===identity&&request===sequence.current)setState({owner:identity,cart,loading:false,error:''});}
      catch(e){if(active&&request===sequence.current){setState(s=>({...s,owner:identity,loading:false,error:e.message}));if(e.status===401)refreshCustomer();}}
    }
    refreshRef.current=refresh;
    setState({owner:identity,cart:empty,loading:!!identity,error:''});
    if(!identity)return;
    refresh();const stop=watchCart(refresh);window.addEventListener('focus',refresh);
    return()=>{active=false;sequence.current++;stop();window.removeEventListener('focus',refresh);};
  },[identity,refreshCustomer]);
  async function mutate(path,body,method){
    const owner=current.current;
    if(!owner)throw new Error('Please sign in to use your shopping bag.');
    try{
      await customerRequest(path,body,method);
      if(current.current===owner)await refreshRef.current();
    }catch(e){if(e.status===401)refreshCustomer();if(current.current===owner)refreshRef.current();throw e;}
  }
  const visible=state.owner===identity?state:{cart:empty,loading:!!identity,error:''};
  return <Context.Provider value={{...visible,refresh:()=>refreshRef.current(),add:(variantId,quantity)=>mutate('/cart/items',{variantId,quantity}),update:(id,quantity)=>mutate('/cart/items/'+id,{quantity},'PATCH'),remove:id=>mutate('/cart/items/'+id,undefined,'DELETE')}}>{children}</Context.Provider>;
}
