import React from 'react';
import { Link,useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/HomePage/Navbar';
import Footer from '../../../components/HomePage/Footer';
import ShopProductCard from '../../../components/Shared/ShopProductCard';
import useShop from '../../../hooks/useShop';
import './Shop.css';
export default function Shop(){
  const [params,setParams]=useSearchParams();
  const query=params.toString();
  const {data,loading,error,retry}=useShop('/products?'+query);
  const categories=useShop('/categories');
  function filter(key,value){setParams(old=>{const next=new URLSearchParams(old);value?next.set(key,value):next.delete(key);next.delete('page');return next;},{replace:true});}
  return <div className="shop-page"><Navbar/><main><section className="shop-intro"><Link to="/">Home</Link><span> / The collection</span><p className="eyebrow">MONEY HOLD / EVERYDAY EXPRESSION</p><h1>Find your<br/><em>next favourite.</em></h1><p>Explore the collection. Make it your own.</p></section>
    <section className="shop-collection"><div className="shop-filters"><label>Search<input type="search" placeholder="Search clothing…" value={params.get('q')||''} onChange={e=>filter('q',e.target.value)} maxLength={100}/></label><label>Category<select value={params.get('category')||''} onChange={e=>filter('category',e.target.value)}><option value="">All categories</option>{categories.data?.categories.map(c=><option key={c.id} value={c.id}>{c.name} ({c.product_count})</option>)}</select></label><label>Sort by<select value={params.get('sort')||'newest'} onChange={e=>filter('sort',e.target.value)}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label><label className="shop-stock-filter"><input type="checkbox" checked={params.get('stock')==='true'} onChange={e=>filter('stock',e.target.checked?'true':'')}/>In stock only</label></div>
    {categories.error&&<p role="alert">Categories unavailable. <button onClick={categories.retry}>Retry categories</button></p>}
    {loading?<p role="status">Loading the collection…</p>:error?<div className="shop-empty" role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>:<><div className="shop-result-count">{data.total} {data.total===1?'piece':'pieces'} in the collection</div>{data.products.length?<div className="shop-grid">{data.products.map(p=><ShopProductCard key={p.id} product={p}/>)}</div>:<div className="shop-empty"><h2>No pieces found</h2><p>Try another search or explore the full collection.</p><button onClick={()=>setParams({})}>Clear filters</button></div>}{data.pages>1&&<nav className="shop-pagination" aria-label="Product pages"><button disabled={data.page<=1} onClick={()=>setParams(old=>{const p=new URLSearchParams(old);p.set('page',data.page-1);return p;})}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={data.page>=data.pages} onClick={()=>setParams(old=>{const p=new URLSearchParams(old);p.set('page',data.page+1);return p;})}>Next</button></nav>}</>}
    </section></main><Footer/></div>;
}
