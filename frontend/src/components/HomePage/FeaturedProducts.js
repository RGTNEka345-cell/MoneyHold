import React from 'react';
import useShop from '../../hooks/useShop';
import ShopProductCard from '../Shared/ShopProductCard';
import '../../pages/customer/Shop/Shop.css';
export default function FeaturedProducts(){
  const {data,loading,error,retry}=useShop('/products?sort=newest');
  return <div className="shop-featured">{loading?<p role="status">Loading the collection…</p>:error?<div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>:!data.products.length?<p>Our next collection is on its way. Check back soon.</p>:<div className="shop-grid">{data.products.slice(0,3).map(p=><ShopProductCard key={p.id} product={p}/>)}</div>}</div>;
}
