import {useCallback,useEffect,useRef,useState} from 'react';
import {customerRequest} from '../services/customerApi';
import {sellerRequest} from '../services/sellerApi';
export default function useOrders(path,seller=false){
  const [state,setState]=useState({key:null,data:null,loading:true,error:''});
  const [version,setVersion]=useState(0);
  const key=JSON.stringify([path,seller,version]);
  const sequence=useRef(0);
  const retry=useCallback(()=>setVersion(v=>v+1),[]);
  useEffect(()=>{
    let active=true;
    setState({key,data:null,loading:true,error:''});
    const refresh=async()=>{
      const request=++sequence.current;
      try{const data=await (seller?sellerRequest:customerRequest)(path);if(active&&request===sequence.current)setState({key,data,loading:false,error:''});}
      catch(e){if(active&&request===sequence.current)setState(s=>({...s,loading:false,error:e.message}));}
    };
    refresh();
    const source=new EventSource((process.env.REACT_APP_API_URL||'http://localhost:5000/api')+(seller?'/seller':'/customer')+'/orders/events',{withCredentials:true});
    source.onmessage=refresh;window.addEventListener('focus',refresh);
    return()=>{active=false;sequence.current++;source.close();window.removeEventListener('focus',refresh);};
  },[path,seller,version,key]);
  // Route changes render before effects run. Never expose a previous route's
  // detail payload to a list page (or the reverse) during that first render.
  const visible=state.key===key?state:{data:null,loading:true,error:''};
  return {...visible,retry};
}
