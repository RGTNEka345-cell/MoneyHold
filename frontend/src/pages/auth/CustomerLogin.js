
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout, { EyeIcon } from "../../components/Auth/AuthLayout";
import "./CustomerLogin.css";

export default function CustomerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get("email") || !data.get("password")) return setError("Please enter your email and password.");
    setError("Authentication API will be connected in the backend step.");
  };

  return (
    <AuthLayout visualTitle={<>Welcome back to <em>the hold.</em></>} visualText="Sign in to access your orders, saved pieces and a shopping experience curated around you.">
      <div className="auth-form-wrap">
        <span className="auth-kicker">CUSTOMER ACCESS</span>
        <h1>Welcome back.</h1>
        <p className="auth-lead">New to Money Hold? <Link to="/register">Create an account</Link></p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field"><label htmlFor="customer-email">Email address</label><input id="customer-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" /></div>
          <div className="auth-field password-field"><label htmlFor="customer-password">Password</label><input id="customer-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><EyeIcon hidden={!showPassword} /></button></div>
          <div className="auth-options"><label className="auth-check"><input name="remember" type="checkbox" />Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>
          {error && <p className="auth-error" role="status">{error}</p>}
          <button className="auth-submit" type="submit">Sign in to your account <span>→</span></button>
        </form>
        <div className="auth-divider">OR</div>
        <Link className="seller-entry" to="/seller/login">Seller portal <span>↗</span></Link>
      </div>
    </AuthLayout>
  );
}
