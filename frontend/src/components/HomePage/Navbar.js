
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useCustomer } from '../Customer/CustomerSessionProvider';
import { useCart } from '../Customer/CartProvider';
import NotificationBell from '../Shared/NotificationBell';

const Icon = ({ type }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></>,
    bag: <><path d="M5 8.5h14l-1 12H6l-1-12Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
};

export default function Navbar() {
  const {customer}=useCustomer();
  const {cart}=useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="announcement">CASH ON DELIVERY · DELIVERY CHARGES SHOWN AT CHECKOUT</div>
      <header className={`nav-shell ${scrolled ? "nav-scrolled" : ""}`}>
        <Link className="wordmark" to="/" aria-label="Money Hold home">
          <span className="wordmark-mark">MH</span>
          <span>MONEY HOLD</span>
        </Link>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <span></span><span></span>
        </button>

        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <Link to="/shop?sort=newest" onClick={() => setOpen(false)}>New arrivals</Link>
          <Link to="/shop" onClick={() => setOpen(false)}>Shop</Link>
          <a href="/#story" onClick={() => setOpen(false)}>Our story</a>
        </nav>

        <div className="nav-actions">
          {customer&&<NotificationBell key={customer.id}/>}
          <Link className="nav-icon-link" to="/shop" aria-label="Search products"><Icon type="search" /></Link>
          <Link className="nav-icon-link customer-account-link" to={customer?'/customer/account':'/login'} aria-label={customer?'My account':'Sign in'} title={customer?'Signed in as '+customer.firstName:'Sign in'}><Icon type="user" />{customer&&<span className="customer-session-dot"/>}</Link>
          <Link className="bag-button nav-icon-link" to="/customer/cart" aria-label={'Shopping bag, '+cart.count+' items'}><Icon type="bag" /><span>{cart.count}</span></Link>
        </div>
      </header>
    </>
  );
}
