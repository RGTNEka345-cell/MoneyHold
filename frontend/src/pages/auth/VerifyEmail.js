import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import { resendCustomerOTP, verifyCustomerEmail } from "../../services/api";
import "./VerifyEmail.css";
import { useCustomer } from '../../components/Customer/CustomerSessionProvider';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const {accept}=useCustomer();
  const email = location.state?.email || sessionStorage.getItem("moneyHoldPendingEmail") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(location.state?.needsResend ? 0 : 60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code from your email.");
    try {
      setSubmitting(true);
      const result = await verifyCustomerEmail({ email, otp });
      accept(result.customer);
      sessionStorage.removeItem("moneyHoldPendingEmail");
      setMessage(result.message);
      navigate('/customer/account',{replace:true});
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError(""); setMessage("");
    try {
      const result = await resendCustomerOTP(email);
      setMessage(result.message); setCountdown(60); setOtp("");
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.retryAfter) setCountdown(requestError.retryAfter);
    } finally { setResending(false); }
  };

  return (
    <AuthLayout visualTitle={<>One step from <em>the hold.</em></>} visualText="Verify your email to protect your account and receive reliable order updates.">
      <div className="auth-form-wrap verify-wrap">
        <span className="auth-kicker">EMAIL VERIFICATION</span><h1>Check your inbox.</h1>
        <p className="auth-lead">Verify <strong>{email}</strong> with your 6-digit email code. If you haven't received one, select Resend code below.</p>
        <form className="auth-form" onSubmit={handleVerify}>
          <div className="auth-field otp-field"><label htmlFor="otp">Verification code</label><input id="otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus /></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Verifying..." : "Verify email"}<span>→</span></button>
        </form>
        <div className="verify-actions"><span>Didn't receive the code?</span><button type="button" onClick={handleResend} disabled={countdown > 0 || resending}>{resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}</button></div>
        <p className="auth-switch"><Link to="/register">← Change registration details</Link></p>
      </div>
    </AuthLayout>
  );
}
