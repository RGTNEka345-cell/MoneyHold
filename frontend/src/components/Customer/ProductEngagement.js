import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {useCustomer} from './CustomerSessionProvider';
import useAccountData from '../../hooks/useAccountData';
import useShop,{shopImage,formatPrice} from '../../hooks/useShop';
import {customerRequest} from '../../services/customerApi';
import './ProductEngagement.css';
export function WishlistButton({productId}){
 const {customer}=useCustomer();
 return customer?<SavedButton key={customer.id+':'+productId} productId={productId}/>:<Link className="engagement-button" to="/login" state={{from:'/shop/'+productId}}>♡ Sign in to save</Link>;
}
function SavedButton({productId}){
 const {data,loading,error,refresh}=useAccountData('/wishlist');const [busy,setBusy]=useState(false),[failure,setFailure]=useState('');
 const saved=data?.items.some(p=>Number(p.id)===Number(productId));
 async function toggle(){setBusy(true);setFailure('');try{await customerRequest('/wishlist/'+productId,{},saved?'DELETE':'PUT');await refresh();}catch(e){setFailure(e.message);}finally{setBusy(false);}}
 return <div className="engagement"><button className="engagement-button" disabled={busy||loading||!!error} aria-pressed={!!saved} onClick={toggle}>{busy?'Updating…':saved?'♥ Saved · Remove':'♡ Save to wishlist'}</button>{(failure||error)&&<p role="alert">{failure||error} <button onClick={refresh}>Retry</button></p>}<Link className="mh-action" to="/customer/wishlist">View wishlist</Link></div>;
}
export function Wishlist(){
 const {data,loading,error,refresh}=useAccountData('/wishlist');const [busy,setBusy]=useState(null),[failure,setFailure]=useState('');
 async function remove(id){setBusy(id);setFailure('');try{await customerRequest('/wishlist/'+id,{},'DELETE');await refresh();}catch(e){setFailure(e.message);}finally{setBusy(null);}}
 return <section className="engagement"><p className="eyebrow">YOUR SAVED PIECES</p><h1>My wishlist</h1><p>Save your favourites here. Choose a size and colour on the product page when you are ready to buy.</p><Link className="engagement-button" to="/shop">Explore the collection</Link>{(error||failure)&&<p role="alert">{error||failure} <button onClick={refresh}>Retry</button></p>}{loading?<p role="status">Loading wishlist…</p>:<div className="wishlist-grid">{data?.items.map(p=><article key={p.id}>{p.image_id&&!!p.is_active?<img src={shopImage(p.image_id)} alt={p.name}/>:<div className="wishlist-placeholder">MONEY HOLD</div>}<h2>{p.name}</h2><p>{formatPrice(p.price)}</p>{p.is_active?<Link className="engagement-button" to={'/shop/'+p.id}>Choose size & colour</Link>:<p>Currently unavailable</p>}<button disabled={busy!==null} onClick={()=>remove(p.id)} aria-label={'Remove '+p.name}>Remove</button></article>)}{data?.items.length===0&&<p>Your wishlist is empty. Save a piece from its product page to get started.</p>}</div>}</section>;
}
export function ProductReviews({productId}){
 const {customer}=useCustomer();const [page,setPage]=useState(1);const {data,loading,error,retry}=useShop('/products/'+productId+'/reviews?page='+page);
 return <section className="engagement product-reviews"><header><p className="eyebrow">FROM THE MONEY HOLD COMMUNITY</p><h2>Customer reviews</h2>{data&&<p><strong>★ {Number(data.average).toFixed(1)} / 5</strong> · {data.total} reviews</p>}</header>{customer?<ReviewEditor key={customer.id+':'+productId} productId={productId}/>:<p><Link className="mh-action" to="/login" state={{from:'/shop/'+productId}}>Sign in</Link> to review your delivered purchase.</p>}{loading?<p role="status">Loading reviews…</p>:error?<p role="alert">{error} <button onClick={retry}>Retry</button></p>:<>{data?.reviews.map(review=><article className="review-card" key={review.id}><strong>{review.author}</strong><span className="review-verified">Verified purchase</span><p aria-label={review.rating+' out of 5 stars'} className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><p className="review-body">{review.body}</p></article>)}{data?.total===0&&<p>No reviews yet. Be the first to share your experience.</p>}{data?.pages>1&&<div className="review-pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {data.pages}</span><button disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</>}</section>;
}
function ReviewEditor({productId}){
 const {data,loading,error,refresh}=useAccountData('/reviews/'+productId);
 return loading?<p>Checking review eligibility…</p>:error?<p role="alert">{error} <button onClick={refresh}>Retry</button></p>:data?.eligible||data?.review?<ReviewForm data={data} refresh={refresh} productId={productId}/>:<p className="review-policy">You can review this piece once your order is marked delivered. One review per product; you can edit or remove it later.</p>;
}
function ReviewForm({data,refresh,productId}){
 const [form,setForm]=useState(()=>({rating:data.review?.rating||5,body:data.review?.body||'',version:data.review?.version||0}));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const stale=form.version!==(data.review?.version||0);
 async function save(e,remove=false){e.preventDefault();setBusy(true);setError('');setMessage('');try{await customerRequest('/reviews/'+productId,form,remove?'DELETE':'PUT');await refresh();setMessage(remove?'Review removed.':'Review saved.');}catch(err){setError(err.message);if(err.status===409)refresh();}finally{setBusy(false);}}
 return <form className="review-form" onSubmit={save}><h3>{data.review?'Your review':'Write a review'}</h3><fieldset disabled={busy||stale}><label>Rating<select value={form.rating} onChange={e=>setForm({...form,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label><label>Your experience<textarea required minLength={5} maxLength={2000} value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label><button className="engagement-button" disabled={!data.eligible}>{busy?'Saving…':'Save review'}</button>{data.review&&<button type="button" onClick={e=>save(e,true)}>Delete my review</button>}</fieldset>{stale&&<p role="status">Your review has changed. <button type="button" onClick={()=>setForm({rating:data.review?.rating||5,body:data.review?.body||'',version:data.review?.version||0})}>Load latest review</button></p>}{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}</form>;
}
