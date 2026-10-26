import {useCallback,useEffect,useRef,useState} from 'react';
import {customerRequest,watchAccount} from '../services/customerApi';
export default function useAccountData(path){
  const [state,setState]=useState({data:null,loading:true,error:''});
  const refreshRef=useRef(async()=>{});
  useEffect(()=>{
    let active=true,sequence=0;setState({data:null,loading:true,error:''});
    async function refresh(){const seq=++sequence;try{const data=await customerRequest(path);if(active&&seq===sequence)setState({data,loading:false,error:''});}catch(e){if(active&&seq===sequence)setState(s=>({data:[401,403].includes(e.status)?null:s.data,loading:false,error:e.message}));}}
    refreshRef.current=refresh;refresh();const stop=watchAccount(refresh);window.addEventListener('focus',refresh);
    return()=>{active=false;sequence++;stop();window.removeEventListener('focus',refresh);};
  },[path]);
  const refresh=useCallback(()=>refreshRef.current(),[]);
  return {...state,refresh};
}
