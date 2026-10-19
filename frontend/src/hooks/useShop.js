import { useEffect, useState } from 'react';
const base = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api')+'/shop';
export const shopImage = id => `${base}/images/${id}`;
export const formatPrice = price => new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(price);
export default function useShop(path) {
  const [state,setState]=useState({data:null,loading:true,error:''});
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true,controller;
    setState({data:null,loading:true,error:''});
    async function refresh(){
      controller?.abort();controller=new AbortController();
      try{
        const response=await fetch(base+path,{signal:controller.signal});
        const data=await response.json();
        if(!response.ok)throw Object.assign(new Error(data.message||'Unable to load the collection.'),{status:response.status});
        if(active)setState({data,loading:false,error:''});
      }catch(e){if(active&&e.name!=='AbortError')setState({data:null,loading:false,error:e.message,status:e.status});}
    }
    refresh();
    const source=new EventSource(base+'/events');source.onmessage=refresh;
    // Native EventSource reconnects; its initial event refreshes missed updates.
    window.addEventListener('focus',refresh);
    return()=>{active=false;controller?.abort();source.close();window.removeEventListener('focus',refresh);};
  },[path,retry]);
  return {...state,retry:()=>setRetry(x=>x+1)};
}
