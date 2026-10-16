
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Icon = ({ type }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></>,
    bag: <><path d="M5 8.5h14l-1 12H6l-1-12Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="announcement">COMPLIMENTARY ISLANDWIDE DELIVERY ON ORDERS OVER LKR 15,000</div>
      <header className={`nav-shell ${scrolled ? "nav-scrolled" : ""}`}>
        <Link className="wordmark" to="/" aria-label="Money Hold home">
          <span className="wordmark-mark">MH</span>
          <span>MONEY HOLD</span>
        </Link>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <span></span><span></span>
        </button>

        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="#new" onClick={() => setOpen(false)}>New arrivals</a>
          <a href="#collection" onClick={() => setOpen(false)}>Collection</a>
          <a href="#story" onClick={() => setOpen(false)}>Our story</a>
        </nav>

        <div className="nav-actions">
          <button aria-label="Search"><Icon type="search" /></button>
          <Link className="nav-icon-link" to="/login" aria-label="Account"><Icon type="user" /></Link>
          <button className="bag-button" aria-label="Shopping bag"><Icon type="bag" /><span>0</span></button>
        </div>
      </header>
    </>
  );
}
