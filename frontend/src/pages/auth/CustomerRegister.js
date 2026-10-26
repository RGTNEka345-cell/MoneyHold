import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout, { EyeIcon } from "../../components/Auth/AuthLayout";
import { registerCustomer } from "../../services/api";
import "./CustomerRegister.css";

export default function CustomerRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    if (!["firstName", "lastName", "email", "phone", "password", "confirmPassword"].every((key) => data.get(key))) return setError("Please complete all required fields.");
    if (data.get("password") !== data.get("confirmPassword")) return setError("Passwords do not match.");
    if (!data.get("terms")) return setError("Please accept the terms to create your account.");

    try {
      setSubmitting(true);
      const result = await registerCustomer({
        firstName: data.get("firstName"), lastName: data.get("lastName"),
        email: data.get("email"), phone: data.get("phone"),
        password: data.get("password"), confirmPassword: data.get("confirmPassword"),
      });
      sessionStorage.setItem("moneyHoldPendingEmail", result.email);
      navigate("/verify-email", { state: { email: result.email } });
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.verificationRequired) {
        const pendingEmail = data.get("email");
        sessionStorage.setItem("moneyHoldPendingEmail", pendingEmail);
        navigate("/verify-email", { state: { email: pendingEmail, needsResend: true } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout visualTitle={<>Enter the world of <em>Money Hold.</em></>} visualText="Create your account for faster checkout, live order updates and early access to every limited release.">
      <div className="auth-form-wrap register-wrap">
        <span className="auth-kicker">CREATE YOUR ACCOUNT</span><h1>Join the hold.</h1>
        <p className="auth-lead">Already a member? <Link className="mh-action" to="/login">Sign in here</Link></p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-row">
            <div className="auth-field"><label htmlFor="first-name">First name</label><input id="first-name" name="firstName" placeholder="First name" autoComplete="given-name" /></div>
            <div className="auth-field"><label htmlFor="last-name">Last name</label><input id="last-name" name="lastName" placeholder="Last name" autoComplete="family-name" /></div>
          </div>
          <div className="auth-field"><label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" /></div>
          <div className="auth-field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" placeholder="+94 77 123 4567" autoComplete="tel" /></div>
          <div className="auth-row">
            <div className="auth-field password-field"><label htmlFor="register-password">Password</label><input id="register-password" name="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" autoComplete="new-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility"><EyeIcon hidden={!showPassword} /></button></div>
            <div className="auth-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" /></div>
          </div>
          <label className="auth-check terms"><input name="terms" type="checkbox" />I agree to the <a href="#terms">Terms & Conditions</a> and <a href="#privacy">Privacy Policy</a>.</label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Sending verification code..." : "Create my account"}<span>→</span></button>
        </form>
      </div>
    </AuthLayout>
  );
}
