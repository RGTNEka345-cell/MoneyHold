
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { customerRequest } from '../../services/customerApi';
import { useCustomer } from '../../components/Customer/CustomerSessionProvider';
import AuthLayout, { EyeIcon } from "../../components/Auth/AuthLayout";
import "./CustomerLogin.css";

export default function CustomerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy,setBusy]=useState(false);
  const {accept}=useCustomer();
  const navigate=useNavigate();
  const location=useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(busy)return;
    const data = new FormData(event.currentTarget);
    if (!data.get("email") || !data.get("password")) return setError("Please enter your email and password.");
    setBusy(true);setError('');
    try{
      const result=await customerRequest('/login',{email:data.get('email'),password:data.get('password'),remember:data.get('remember')==='on'});
      accept(result.customer);
      const destination=location.state?.from;
      navigate(typeof destination==='string' && /^\/(customer\/(?:[a-z]+|orders\/\d+)|shop\/\d+)$/.test(destination)?destination:'/customer/account',{replace:true});
    }catch(e){
      if(e.verificationRequired){sessionStorage.setItem('moneyHoldPendingEmail',e.email);navigate('/verify-email',{state:{email:e.email,needsResend:true}});}
      else setError(e.message);
    }finally{setBusy(false);}
  };

  return (
    <AuthLayout visualTitle={<>Welcome back to <em>the hold.</em></>} visualText="Sign in to access your orders, saved pieces and a shopping experience curated around you.">
      <div className="auth-form-wrap">
        <span className="auth-kicker">CUSTOMER ACCESS</span>
        <h1>Welcome back.</h1>
        <p className="auth-lead">New to Money Hold? <Link className="mh-action" to="/register">Create an account</Link></p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {busy&&<p role="status">Signing in…</p>}
          <fieldset disabled={busy} style={{display:'contents',border:0}}>
          <div className="auth-field"><label htmlFor="customer-email">Email address</label><input id="customer-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" /></div>
          <div className="auth-field password-field"><label htmlFor="customer-password">Password</label><input id="customer-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><EyeIcon hidden={!showPassword} /></button></div>
          <div className="auth-options"><label className="auth-check"><input name="remember" type="checkbox" />Remember me</label><Link className="mh-action" to="/forgot-password">Forgot password?</Link></div>
          {error && <p className="auth-error" role="status">{error}</p>}
          <button className="auth-submit" type="submit">Sign in to your account <span>→</span></button>
          </fieldset>
        </form>
        <div className="auth-divider">OR</div>
        <Link className="seller-entry" to="/seller/login">Seller portal <span>↗</span></Link>
      </div>
    </AuthLayout>
  );
}
