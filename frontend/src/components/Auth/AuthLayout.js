import React from "react";
import { Link } from "react-router-dom";
import "./AuthLayout.css";

export function BrandMark() {
  return (
    <Link className="auth-brand" to="/" aria-label="Money Hold home">
      <span className="auth-monogram">MH</span>
      <span>MONEY HOLD</span>
    </Link>
  );
}

export function EyeIcon({ hidden }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

export default function AuthLayout({ children, mode = "customer", visualTitle, visualText }) {
  return (
    <main className={`auth-page auth-${mode}`}>
      <section className="auth-visual" aria-label="Money Hold brand presentation">
        <img src="/assets/money-hold-showcase.png" alt="Money Hold premium streetwear" />
        <div className="auth-visual-overlay"></div>
        <BrandMark />
        <div className="auth-visual-copy">
          <span className="auth-kicker">MONEY HOLD · PREMIUM STREETWEAR</span>
          <h2>{visualTitle}</h2>
          <p>{visualText}</p>
        </div>
        <span className="auth-visual-index">MH / 2026</span>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-header"><BrandMark /></div>
        {children}
        <p className="auth-copyright">© 2026 MONEY HOLD · COLOMBO, SRI LANKA</p>
      </section>
    </main>
  );
}
