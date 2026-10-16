
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sellerRequest } from '../../services/sellerApi';
import AuthLayout, { EyeIcon } from "../../components/Auth/AuthLayout";
import "./SellerLogin.css";

export default function SellerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (!data.get("email") || !data.get("password")) return setError("Please enter your seller credentials.");
    setError(''); setBusy(true);
    try {
      await sellerRequest('/login', { email: data.get('email'), password: data.get('password'), remember: data.get('remember') === 'on' });
      navigate('/seller/dashboard', { replace: true });
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthLayout mode="seller" visualTitle={<>Control the <em>collection.</em></>} visualText="Manage products, stock and customer orders from the private Money Hold seller workspace.">
      <div className="auth-form-wrap">
        <span className="auth-kicker">PRIVATE SELLER PORTAL</span>
        <h1>Seller sign in.</h1>
        <p className="auth-lead">Authorized Money Hold management access only.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {busy && <p role="status">Signing in…</p>}
          <fieldset disabled={busy} style={{ display: 'contents', border: 0 }}>
          <div className="auth-field"><label htmlFor="seller-email">Seller email</label><input id="seller-email" name="email" type="email" placeholder="seller@moneyhold.lk" autoComplete="email" /></div>
          <div className="auth-field password-field"><label htmlFor="seller-password">Password</label><input id="seller-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><EyeIcon hidden={!showPassword} /></button></div>
          <div className="auth-options"><label className="auth-check"><input name="remember" type="checkbox" />Keep me signed in</label></div>
          {error && <p className="auth-error" role="status">{error}</p>}
          <button className="auth-submit" type="submit">Enter seller dashboard <span>→</span></button>
          </fieldset>
        </form>
        <p className="auth-switch">Shopping with us? <Link to="/login">Customer sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
