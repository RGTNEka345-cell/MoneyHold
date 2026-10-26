
import React from "react";
import { Link } from "react-router-dom";
import FeaturedProducts from "../components/HomePage/FeaturedProducts";
import Navbar from "../components/HomePage/Navbar";
import Footer from "../components/HomePage/Footer";
import "./HomePage.css";

const Arrow = () => <span className="arrow">↗</span>;


export default function HomePage() {
  return (
    <main id="top" className="home-page">
      <Navbar />

      <section className="hero">
        <img src="/assets/money-hold-showcase.png" alt="Money Hold premium black streetwear shown from front and back" />
        <div className="hero-shade"></div>
        <div className="hero-content">
          <p className="eyebrow">THE SIGNATURE SERIES · 2026</p>
          <h1>Hold your<br/><em>presence.</em></h1>
          <p className="hero-copy">Refined streetwear built around quiet confidence, considered detail and an unmistakable identity.</p>
          <Link className="primary-cta" to="/shop">Explore the collection <Arrow /></Link>
        </div>
        <div className="hero-index"><span>01</span><div></div><span>04</span></div>
        <a href="#new" className="scroll-cue">SCROLL TO DISCOVER <span>↓</span></a>
      </section>

      <section id="new" className="intro section-pad">
        <div className="section-label">01 / THE DROP</div>
        <div className="intro-copy">
          <p className="eyebrow">NEW ARRIVAL</p>
          <h2>Designed for those<br/>who move <em>differently.</em></h2>
          <p>Premium construction meets a bold, minimal identity. Every placement, stitch and finish is deliberate.</p>
        </div>
        <div className="detail-strip">
          <div><strong>01</strong><span>Embroidered<br/>front mark</span></div>
          <div><strong>02</strong><span>Statement<br/>back print</span></div>
          <div><strong>03</strong><span>Custom woven<br/>neck label</span></div>
          <div><strong>04</strong><span>Signature<br/>sleeve tag</span></div>
        </div>
      </section>

      <section id="collection" className="collection section-pad">
        <div className="section-heading">
          <div><p className="eyebrow">CURATED FOR YOU</p><h2>Featured pieces</h2></div>
          <Link className="mh-action" to="/shop">View all products <Arrow /></Link>
        </div>
        <FeaturedProducts />
      </section>

      <section id="story" className="story">
        <div className="story-image"><img src="/assets/money-hold-showcase.png" alt="Money Hold garment craftsmanship details" /></div>
        <div className="story-content">
          <p className="eyebrow">THE MONEY HOLD CODE</p>
          <h2>More than a name.<br/><em>A state of mind.</em></h2>
          <p>Money Hold is created for people who understand that presence speaks before words do. The collection balances premium comfort with a sharp visual language—made to be noticed, never forced.</p>
          <a href="#about">Discover our story <Arrow /></a>
          <div className="story-signature">MH</div>
        </div>
      </section>

      <section className="newsletter section-pad">
        <p className="eyebrow">PRIVATE ACCESS</p>
        <h2>Be first to know.</h2>
        <p>Join the Money Hold list for early access to drops and limited releases.</p>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="Enter your email address" required />
          <button type="submit">Join the list <Arrow /></button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
