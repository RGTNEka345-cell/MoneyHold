import React, { useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import Navbar from '../../../components/HomePage/Navbar';
import Footer from '../../../components/HomePage/Footer';
import useShop,{shopImage,formatPrice} from '../../../hooks/useShop';
import '../Shop/Shop.css';
import AddToCart from '../../../components/Customer/AddToCart';
export default function ProductDetails(){
  const {id}=useParams();
  const {data,loading,error,retry}=useShop('/products/'+encodeURIComponent(id));
  const [selection,setSelection]=useState({});
  const [photo,setPhoto]=useState(null);
  const product=data?.product;
  const colours=[...new Set(product?.variants.map(v=>v.colour)||[])];
  const colour=selection.productId===id&&colours.includes(selection.colour)?selection.colour:colours[0];
  const size=selection.productId===id?selection.size:'';
  const variant=product?.variants.find(v=>v.colour===colour&&v.size===size);
  const image=product?.images.find(i=>i.id===photo)||product?.images[0];
  return <div className="shop-page"><Navbar/><main className="shop-detail"><Link to="/shop">← Back to collection</Link>{loading?<p role="status">Loading product…</p>:error?<div className="shop-empty" role="alert"><h1>{data?'Product unavailable':'Unable to display this piece'}</h1><p>{error}</p><button onClick={retry}>Try again</button></div>:<div className="shop-detail-grid"><section className="shop-gallery" aria-label="Product photos">{image?<img className="shop-main-photo" src={shopImage(image.id)} alt={product.name}/>:<div className="shop-empty">Photo coming soon</div>}<div className="shop-thumbnails">{product.images.map((i,n)=><button key={i.id} type="button" aria-label={'Show photo '+(n+1)} aria-pressed={image?.id===i.id} onClick={()=>setPhoto(i.id)}><img src={shopImage(i.id)} alt={product.name+' view '+(n+1)}/></button>)}</div></section>
      <section className="shop-product-copy"><p className="eyebrow">{product.category_name}</p><h1>{product.name}</h1><p className="shop-detail-price">{formatPrice(product.price)}</p><p className="shop-description">{product.description}</p><fieldset><legend>Colour: {colour}</legend><div className="shop-options">{colours.map(c=><button key={c} type="button" aria-pressed={colour===c} onClick={()=>setSelection({productId:id,colour:c,size:''})}>{c}</button>)}</div></fieldset><fieldset><legend>Select size</legend><div className="shop-options">{product.variants.filter(v=>v.colour===colour).map(v=><button key={v.id} type="button" aria-pressed={size===v.size} disabled={v.stock===0} title={v.stock===0?'Out of stock':v.size} onClick={()=>setSelection({productId:id,colour,size:v.size})}>{v.size}{v.stock===0?' — sold out':''}</button>)}</div></fieldset><p className="shop-availability" role="status">{variant?(variant.stock>0?variant.stock+' available in '+variant.size+' / '+variant.colour:'This combination is now out of stock.'):product.variants.some(v=>v.stock>0)?'Select a size to check availability.':'This piece is currently sold out.'}</p><AddToCart key={variant?.id || id} variant={variant}/><Link className="shop-more-link" to={'/shop?category='+product.category_id}>More from {product.category_name} ↗</Link></section>
    </div>}</main><Footer/></div>;
}
