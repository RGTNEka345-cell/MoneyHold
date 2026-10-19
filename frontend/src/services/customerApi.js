const base=process.env.REACT_APP_API_URL||'http://localhost:5000/api';
export async function customerRequest(path,body,method){
  const response=await fetch(base+'/customer'+path,{credentials:'include',method:method||(body===undefined?'GET':'POST'),headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.message||'Unable to connect. Please try again.'),{status:response.status,verificationRequired:data.verificationRequired,email:data.email});
  return data;
}
export function watchCart(onChange){const stream=new EventSource(base+'/customer/cart/events',{withCredentials:true});stream.onmessage=onChange;return ()=>stream.close();}
