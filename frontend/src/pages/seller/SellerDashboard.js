
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { sellerRequest } from '../../services/sellerApi';
import './SellerDashboard.css';
import ThemeToggle from '../../components/Theme/ThemeToggle';
export default function SellerDashboard() {
  const { seller } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    const refresh = () => sellerRequest('/dashboard').then(result => { if (active) setData(result); }).catch(error => {
      if (!active) return;
      if (error.status === 401 || error.status === 403) navigate('/seller/login', { replace: true });
      else setError(error.message);
    });
    refresh(); window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [navigate, retry]);
  async function logout() {
    setBusy(true); setError('');
    try { await sellerRequest('/logout', {}); navigate('/seller/login', { replace: true }); }
    catch (error) { setError(error.message); setBusy(false); }
  }
  return <div className="seller-workspace">
    <aside className="seller-sidebar"><Link to="/" className="seller-logo">MONEY HOLD</Link><p>SELLER WORKSPACE</p><a href="#overview" aria-current="page">Overview</a><Link to="/">View storefront ↗</Link><button disabled={busy} onClick={logout}>{busy ? 'Signing out…' : 'Sign out'}</button></aside>
    <main id="overview" className="seller-main">
      <header><span className="eyebrow">PRIVATE SELLER PORTAL</span><ThemeToggle /></header>
      <h1>Welcome, {seller.name}.</h1><p>Your Money Hold store starts here.</p>
      {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(x => x + 1)}>Retry</button></div>}
      <section className="seller-account"><span>ACCOUNT</span><h2>{seller.name}</h2><p>{seller.email}</p><p>You are signed in to the seller workspace.</p></section>
      <h2>Manage your store</h2>
      {!data && !error && <p role="status">Loading your workspace…</p>}
      <div className="seller-modules">{data?.modules.map((item, i) => <section key={item.name}><span>0{i + 1} / COMING SOON</span><h3>{item.name}</h3><p>{item.description}</p></section>)}</div>
    </main>
  </div>;
}
