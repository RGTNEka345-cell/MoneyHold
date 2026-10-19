
import React from "react";
import { Link } from 'react-router-dom';
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="footer-monogram">MH</div>
        <h2>MONEY HOLD</h2>
        <p>Made to hold attention.</p>
      </div>
      <div className="footer-links">
        <div><h3>Shop</h3><Link to="/shop?sort=newest">New arrivals</Link><Link to="/shop">Collection</Link><Link to="/shop?stock=true">Available now</Link></div>
        <div><h3>Help</h3><a href="#contact">Contact</a><a href="#shipping">Delivery</a><a href="#returns">Returns</a></div>
        <div><h3>Follow</h3><a href="#instagram">Instagram</a><a href="#tiktok">TikTok</a><a href="#facebook">Facebook</a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 MONEY HOLD</span><span>COLOMBO, SRI LANKA</span></div>
    </footer>
  );
}
