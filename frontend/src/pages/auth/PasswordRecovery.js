import React,{useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import {customerRequest} from '../../services/customerApi';
import {useCustomer} from '../../components/Customer/CustomerSessionProvider';
import './CustomerLogin.css';
export default function PasswordRecovery({reset=false}){
 const location=useLocation();const {refresh}=useCustomer();
 const [token]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('token')||'');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[show,setShow]=useState(false);
 useEffect(()=>{if(reset&&window.location.hash)window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);},[reset]);
 const invalid=reset&&!/^[a-f0-9]{64}$/.test(token);
 async function submit(e){e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget);setError('');setBusy(true);try{
  if(reset&&form.get('password')!==form.get('confirmPassword'))throw new Error('Passwords do not match.');
  const result=await customerRequest(reset?'/reset-password':'/forgot-password',reset?{token,password:form.get('password'),confirmPassword:form.get('confirmPassword')}:{email:form.get('email')});
  setMessage(result.message);if(reset)await refresh();
 }catch(err){setError(err.message);}finally{setBusy(false);}}
 return <AuthLayout visualTitle={<>A fresh start. <em>Same hold.</em></>} visualText="Securely recover access to your Money Hold account."><div className="auth-form-wrap"><span className="auth-kicker">ACCOUNT RECOVERY</span><h1>{reset?'Set a new password.':'Forgot password?'}</h1><p className="auth-lead">{reset?'Choose a new password. You will need to sign in again on all devices.':'Enter your verified customer email. We will email you a link that expires in 30 minutes.'}</p>{invalid?<p className="auth-error" role="alert">This reset link is missing or invalid. <Link className="mh-action" to="/forgot-password">Request a new link</Link></p>:message?<p role="status">{message}</p>:<form className="auth-form" onSubmit={submit}><fieldset disabled={busy} style={{display:'contents',border:0}}>{reset?<><p>Use at least 8 characters, including a letter and a number.</p>{[['password','New password'],['confirmPassword','Confirm new password']].map(([name,label])=><div className="auth-field" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={show?'text':'password'} required minLength={8} maxLength={72} autoComplete="new-password"/></div>)}<label className="auth-check"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>Show passwords</label></>:<div className="auth-field"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" required maxLength={191} autoComplete="email"/></div>}{error&&<p className="auth-error" role="alert">{error}</p>}<button className="auth-submit">{busy?'Please wait…':reset?'Update password':'Send reset link'}</button></fieldset></form>}<p className="auth-lead"><Link className="mh-action" to="/login">Back to sign in</Link>{reset&&<><br/><Link className="mh-action" to="/forgot-password">Request another reset link</Link></>}</p></div></AuthLayout>;
}
