import React from 'react';
import { Link } from 'react-router-dom';
import { shopImage,formatPrice } from '../../hooks/useShop';
export default function ShopProductCard({ product }) {
  return <article className="shop-card"><Link to={'/shop/'+product.id} className="shop-card-photo">{product.image_id?<img src={shopImage(product.image_id)} alt={product.name} loading="lazy"/>:<span>Photo coming soon</span>}{Number(product.stock)===0&&<span className="shop-sold-out">Sold out</span>}<span className="shop-view">Explore piece ↗</span></Link><div className="shop-card-meta"><p>{product.category_name}</p><h2><Link to={'/shop/'+product.id}>{product.name}</Link></h2><strong>{formatPrice(product.price)}</strong></div></article>;
}
