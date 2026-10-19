import NotificationBell from '../../components/Shared/NotificationBell';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { sellerRequest, sellerImageUrl, watchCatalog } from '../../services/sellerApi';
import ThemeToggle from '../../components/Theme/ThemeToggle';
import './SellerDashboard.css';
import './SellerOverview.css';

function ProductPhoto({ product }) {
  return product.images[0] ? <img src={sellerImageUrl(product.images[0].id)} alt={product.name} loading="lazy" /> : <div className="overview-no-image">Photo needed</div>;
}
export default function SellerDashboard() {
  const { seller } = useOutletContext();
  const navigate = useNavigate();
  const [data,setData] = useState(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    let active=true;
    const refresh=async()=>{
      try {
        const [p,c]=await Promise.all([sellerRequest('/products'),sellerRequest('/categories')]);
        if(active){setData({products:p.products,categories:c.categories});setError('');}
      }catch(e){if(!active)return;if([401,403].includes(e.status))navigate('/seller/login',{replace:true});else setError(e.message);}
    };
    refresh();const stop=watchCatalog(refresh);window.addEventListener('focus',refresh);
    return()=>{active=false;stop();window.removeEventListener('focus',refresh);};
  },[navigate,retry]);
  async function logout(){setBusy(true);try{await sellerRequest('/logout',{});navigate('/seller/login',{replace:true});}catch(e){setError(e.message);setBusy(false);}}
  const products=data?.products||[];
  const variants=products.flatMap(p=>p.variants.map(v=>({...v,product:p})));
  const low=variants.filter(v=>v.stock<=5).sort((a,b)=>a.stock-b.stock);
  const activeCount=products.filter(p=>p.is_active).length;
  const summary=[
    {label:'Total styles',value:products.length,detail:(products.length-activeCount)+' drafts in your collection',tone:'violet',symbol:'◈'},
    {label:'Active products',value:activeCount,detail:'Marked active in your catalog',tone:'mint',symbol:'↗'},
    {label:'Units in stock',value:variants.reduce((n,v)=>n+v.stock,0),detail:variants.length+' size & colour variants',tone:'blue',symbol:'▦'},
    {label:'Stock alerts',value:low.length,detail:'Variants with 5 units or fewer',tone:'peach',symbol:'!'}
  ];
  return <div className="seller-workspace overview-page">
    <aside className="seller-sidebar"><Link className="seller-logo" to="/">MONEY HOLD</Link><p>STORE MANAGEMENT</p><Link to="/seller/dashboard" aria-current="page">◈ Overview</Link><Link to="/seller/catalog">▦ Products & stock</Link><Link to="/seller/catalog?tab=categories">Categories</Link><Link to="/seller/orders">Orders</Link><Link to="/">View storefront ↗</Link><div className="overview-owner"><span>{seller.name.slice(0,1).toUpperCase()}</span><div><strong>{seller.name}</strong><small>Store owner</small></div></div><button disabled={busy} onClick={logout}>{busy?'Signing out…':'Sign out'}</button></aside>
    <main className="seller-main"><header><div><span className="eyebrow">YOUR STORE, AT A GLANCE</span><h1>Hello, {seller.name.split(' ')[0]} <span className="overview-wave">✦</span></h1><p>Let’s make your next collection stand out.</p></div><div style={{display:'flex',alignItems:'center',gap:16}}><NotificationBell seller/><ThemeToggle/></div></header>
      {error&&<div className="overview-error" role="alert">{error} <button onClick={()=>setRetry(x=>x+1)}>Retry</button></div>}
      <section className="overview-hero"><img src="/assets/money-hold-showcase.png" alt="Money Hold black and gold signature streetwear" /><div className="overview-hero-copy"><span>THE MONEY HOLD COLLECTION</span><h2>Your vision.<br/>Their next favourite.</h2><p>From everyday essentials to statement pieces. Build a collection worth wearing.</p><Link to="/seller/catalog?action=new">+ Add a new product</Link></div></section>
      <section className="overview-stats" aria-label="Catalog summary">{summary.map(s=><article key={s.label} className={'overview-stat '+s.tone}><div><span>{s.label}</span><i aria-hidden="true">{s.symbol}</i></div><strong>{data?s.value:'—'}</strong><p>{data?s.detail:'Loading your catalog…'}</p></article>)}</section>
      {!data&&!error&&<p role="status">Loading your store…</p>}
      <div className="overview-columns"><section className="overview-panel"><div className="overview-heading"><div><span>YOUR COLLECTION</span><h2>Latest additions</h2></div><Link to="/seller/catalog">View all ↗</Link></div>
        {data&&!products.length?<div className="overview-empty"><span>✧</span><h3>Every collection starts with one piece.</h3><p>Add a category, upload your product photos, then choose sizes and colours.</p><Link to="/seller/catalog?tab=categories">Create your first category →</Link></div>:<div className="overview-products">{products.slice(0,4).map(p=><article key={p.id}><Link to={'/seller/catalog?edit='+p.id}><ProductPhoto product={p}/></Link><span className={'overview-badge '+(p.is_active?'live':'')}>{p.is_active?'Active':'Draft'}</span><h3>{p.name}</h3><p>{p.category_name}</p><strong>{new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(p.price)}</strong></article>)}</div>}
      </section><section className="overview-panel"><div className="overview-heading"><div><span>INVENTORY HEALTH</span><h2>Needs attention</h2></div><span className="overview-alert-count">{low.length}</span></div>{data&&!low.length?<div className="overview-empty"><span>✓</span><h3>No low-stock alerts</h3><p>{products.length?'Your variants have more than five units available.':'Stock alerts will appear after you add products.'}</p></div>:<div className="overview-alerts">{low.slice(0,5).map(v=><Link to="/seller/catalog?tab=inventory" key={v.id}><ProductPhoto product={v.product}/><div><strong>{v.product.name}</strong><small>{v.size} / {v.colour}</small></div><b>{v.stock===0?'Sold out':v.stock+' left'}</b></Link>)}</div>}<Link className="overview-bottom-link" to="/seller/catalog?tab=inventory">Manage inventory →</Link></section></div>
      <section className="overview-panel overview-category-panel"><div className="overview-heading"><div><span>ORGANISE YOUR STORE</span><h2>Collections by category</h2></div><Link to="/seller/catalog?tab=categories">Manage categories ↗</Link></div><div className="overview-categories">{data?.categories.map((c,i)=>{const photo=products.find(p=>p.category_id===c.id&&p.images.length);return <Link key={c.id} to={'/seller/catalog?category='+c.id} className={'category-tile tone-'+i%4}>{photo?<ProductPhoto product={photo}/>:<span className="category-symbol" aria-hidden="true">{['◈','✦','▦','◇'][i%4]}</span>}<div><strong>{c.name}</strong><small>{c.product_count} products</small></div><span>↗</span></Link>;})}{data&&!data.categories.length&&<p>No categories yet. Start with T-shirts, dresses, trousers or your own collection.</p>}</div></section>
    </main>
  </div>;
}
