import NotificationBell from '../../../components/Shared/NotificationBell';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductPhotos from './ProductPhotos';
import VariantBuilder from './VariantBuilder';
import { sellerRequest, sellerImageUrl, watchCatalog } from '../../../services/sellerApi';
import ThemeToggle from '../../../components/Theme/ThemeToggle';
import '../SellerDashboard.css';
import './SellerCatalog.css';

const blankProduct = () => ({ name:'', description:'', categoryId:'', price:'', active:false, variants:[{size:'M',colour:'Black',stock:0}], imageIds:[] });
const money = n => new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(n);

function StockRow({ product, variant, save }) {
  const [stock, setStock] = useState(String(variant.stock));
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{setStock(String(variant.stock));},[variant.stock]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await save(product,variant,Number(stock)); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <tr><td>{product.name}</td><td>{variant.size} / {variant.colour}</td><td><span className={variant.stock <= 5 ? 'catalog-low' : ''}>{variant.stock === 0 ? 'Out of stock' : variant.stock <= 5 ? 'Low stock' : 'In stock'}</span></td><td>
    <form className="stock-form" onSubmit={submit}><label className="catalog-sr" htmlFor={`stock-${variant.id}`}>Stock for {product.name} {variant.size} {variant.colour}</label><input id={`stock-${variant.id}`} type="number" min="0" max="1000000000" step="1" required value={stock} onChange={e=>setStock(e.target.value)} /><button disabled={busy || stock === String(variant.stock)}>{busy?'Saving…':'Save'}</button></form>{error && <p role="alert">{error}</p>}
  </td></tr>;
}

export default function SellerCatalog() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab,setTab] = useState(['categories','inventory'].includes(params.get('tab'))?params.get('tab'):'products');
  const [categories,setCategories] = useState([]);
  const [products,setProducts] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [query,setQuery] = useState('');
  const [categoryFilter,setCategoryFilter] = useState(params.get('category')||'');
  const [editor,setEditor] = useState(null);
  const [files,setFiles] = useState([]);
  const [category,setCategory] = useState({name:'',description:''});
  const [busy,setBusy] = useState(false);
  const [formError,setFormError] = useState('');
  const [lowOnly,setLowOnly] = useState(false);
  const editorRef = useRef(null);
  const openedFromLink = useRef(false);
  useEffect(()=>{
    if(loading||error||openedFromLink.current)return;
    openedFromLink.current=true;
    if(params.get('action')==='new') {
      if(categories.length)setEditor(blankProduct());
      else {setTab('categories');setNotice('Create your first category, then add your product.');}
    }
    if(params.get('edit')) {
      const p=products.find(p=>String(p.id)===params.get('edit'));
      if(p)setEditor({id:p.id,version:p.version,name:p.name,description:p.description,price:p.price,categoryId:p.category_id,active:!!p.is_active,variants:p.variants.map(v=>({...v})),imageIds:p.images.map(i=>i.id)});
      else setNotice('That product could not be found.');
    }
  },[loading,error,params,products,categories]);
  const editorKey = editor ? (editor.id || 'new') : null;
  useEffect(() => {
    if (editorKey) editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [editorKey]);
  const load = useCallback(async () => {
    try {
      const [c,p] = await Promise.all([sellerRequest('/categories'),sellerRequest('/products')]);
      setCategories(c.categories); setProducts(p.products); setError('');
    } catch(e) {
      if ([401,403].includes(e.status)) navigate('/seller/login',{replace:true});
      else setError(e.message);
    } finally { setLoading(false); }
  },[navigate]);
  useEffect(()=>{load(); const stop=watchCatalog(load); window.addEventListener('focus',load); return ()=>{stop();window.removeEventListener('focus',load);};},[load]);
  function edit(product) {
    setFormError(''); setNotice(''); setFiles([]);
    setEditor(product ? {id:product.id,version:product.version,name:product.name,description:product.description,price:product.price,categoryId:product.category_id,active:!!product.is_active,variants:product.variants.map(v=>({...v})),imageIds:product.images.map(i=>i.id)} : blankProduct());
  }
  async function saveProduct(event) {
    event.preventDefault(); setBusy(true); setFormError('');
    try {
      const payload={...editor,categoryId:Number(editor.categoryId),variants:editor.variants.map(v=>({...v,stock:Number(v.stock)}))};
      const data=new FormData(); data.append('payload',JSON.stringify(payload)); files.forEach(f=>data.append('images',f));
      await sellerRequest(editor.id?`/products/${editor.id}`:'/products',data,editor.id?'PUT':'POST');
      setEditor(null);setFiles([]);setNotice('Product saved.'); await load();
    } catch(e) {setFormError(e.message);} finally {setBusy(false);}
  }
  async function saveCategory(event) {
    event.preventDefault();setBusy(true);setFormError('');
    try { await sellerRequest(category.id?`/categories/${category.id}`:'/categories',category,category.id?'PUT':'POST');setCategory({name:'',description:''});setNotice('Category saved.');await load(); }
    catch(e){setFormError(e.message);}finally{setBusy(false);}
  }
  async function saveStock(product,variant,stock) {
    try {await sellerRequest(`/products/${product.id}/variants/${variant.id}/stock`,{stock,version:product.version},'PATCH');setNotice('Stock updated.');await load();}
    catch(e){await load();throw e;}
  }
  async function logout() {try {await sellerRequest('/logout',{});navigate('/seller/login',{replace:true});}catch(e){setError(e.message);}}
  const filtered=products.filter(p=>(!categoryFilter||String(p.category_id)===categoryFilter)&&p.name.toLowerCase().includes(query.toLowerCase()));
  const change=(key,value)=>setEditor(p=>({...p,[key]:value}));
  const variantChange=(index,key,value)=>setEditor(p=>({...p,variants:p.variants.map((v,i)=>i===index?{...v,[key]:value}:v)}));
  return <div className="seller-workspace catalog-page">
    <aside className="seller-sidebar"><Link to="/" className="seller-logo">MONEY HOLD</Link><p>SELLER WORKSPACE</p><Link to="/seller/dashboard">Overview</Link><Link to="/seller/orders">Orders</Link><Link to="/seller/catalog" aria-current="page">Catalog & stock</Link><Link to="/">View storefront ↗</Link><button onClick={logout}>Sign out</button></aside>
    <main className="seller-main"><header><span className="eyebrow">YOUR COLLECTION</span><div style={{display:'flex',alignItems:'center',gap:16}}><NotificationBell seller/><ThemeToggle/></div></header><h1>Catalog & stock</h1><p>Create your collection. Keep every size and colour in check.</p>
      <nav className="catalog-tabs" aria-label="Catalog sections">{['products','categories','inventory'].map(t=><button key={t} type="button" aria-pressed={tab===t} onClick={()=>{setTab(t);setFormError('');setNotice('');}}>{t}</button>)}</nav>
      {error && <div role="alert" className="catalog-error">{error} <button onClick={load}>Retry</button></div>}
      {notice && <p role="status" className="catalog-success">{notice}</p>}
      {loading ? <p role="status">Loading catalog…</p> : <>
      {tab==='categories' ? <div className="catalog-category-layout">
        <form className="catalog-form" onSubmit={saveCategory}><h2>{category.id?'Edit category':'New category'}</h2><fieldset disabled={busy}><label>Name<input value={category.name} required maxLength={80} onChange={e=>setCategory({...category,name:e.target.value})} /></label><label>Description<textarea value={category.description} maxLength={500} onChange={e=>setCategory({...category,description:e.target.value})} /></label>{formError&&<p role="alert" className="catalog-error">{formError}</p>}<div className="catalog-actions"><button>{busy?'Saving…':'Save category'}</button>{category.id&&<button type="button" onClick={()=>{setCategory({name:'',description:''});setFormError('');}}>Cancel</button>}</div></fieldset></form>
        <section><h2>Categories ({categories.length})</h2><p>Everyday clothing, occasion wear or accessories — organise your collection your way.</p><div className="category-suggestions">{['T-shirts','Shirts','Dresses','Trousers','Jeans','Hoodies','Activewear','Kidswear','Footwear','Accessories'].map(name=><button type="button" key={name} disabled={busy} onClick={()=>{setCategory({name,description:''});setFormError('');}}>{name}</button>)}</div>{!categories.length&&<p>Choose a suggestion or enter your own category name.</p>}{categories.map(c=><article className="catalog-category" key={c.id}><h3>{c.name}</h3><p>{c.description}</p><span>{c.product_count} products</span><button disabled={busy} onClick={()=>{setCategory({...c});setFormError('');}}>Edit</button></article>)}</section>
      </div> : <>
        <div className="catalog-toolbar"><label>Search products<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name" /></label><label>Category<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{tab==='products'?<button disabled={!categories.length||busy} onClick={()=>edit(null)}>+ Add product</button>:<label className="catalog-check"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)} />Low stock only (≤5)</label>}</div>
        {!categories.length&&<p>Create a category first using the Categories tab.</p>}
        {tab==='products' ? <div className="catalog-products">{!filtered.length&&<p>No products found.</p>}{filtered.map(p=><article key={p.id} className="catalog-product">{p.images[0]?<img src={sellerImageUrl(p.images[0].id)} alt={p.name} />:<div className="catalog-no-photo">No photo</div>}<div><span>{p.is_active?'ACTIVE':'DRAFT'} · {p.category_name}</span><h2>{p.name}</h2><strong>{money(p.price)}</strong><p>{p.variants.length} variants · {p.variants.reduce((a,v)=>a+v.stock,0)} units</p><button disabled={busy} onClick={()=>edit(p)}>Edit product</button></div></article>)}</div> : <div className="catalog-table-wrap"><table><caption>Stock per size and colour. Zero stock marks a variant as unavailable.</caption><thead><tr><th>Product</th><th>Variant</th><th>Status</th><th>Stock</th></tr></thead><tbody>{filtered.flatMap(p=>p.variants.filter(v=>!lowOnly||v.stock<=5).map(v=><StockRow key={`${p.id}-${v.id}`} product={p} variant={v} save={saveStock} />))}</tbody></table>{!filtered.some(p=>p.variants.some(v=>!lowOnly||v.stock<=5))&&<p>No matching inventory.</p>}</div>}
      </>}
      </>}
      {editor && <div className="catalog-editor" ref={editorRef}><form className="catalog-form" onSubmit={saveProduct}><h2>{editor.id?'Edit product':'Add product'}</h2><p>Prices in LKR. Add up to four photos, 5 MB each. Existing variants keep their size/colour identity; set stock to zero to stop selling them.</p><fieldset disabled={busy}>
        <div className="catalog-fields"><label>Product name<input required maxLength={150} value={editor.name} onChange={e=>change('name',e.target.value)} /></label><label>Category<select required value={editor.categoryId} onChange={e=>change('categoryId',e.target.value)}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Price (LKR)<input type="number" min="0.01" max="99999999.99" step="0.01" required value={editor.price} onChange={e=>change('price',e.target.value)} /></label><label className="catalog-check"><input type="checkbox" checked={editor.active} onChange={e=>change('active',e.target.checked)} />Active product</label></div>
        <label>Description<textarea required maxLength={5000} rows={4} value={editor.description} onChange={e=>change('description',e.target.value)} /></label>
        <p className="catalog-writing-tip">Include fabric, fit, care instructions and what makes this piece special. Example: relaxed fit, cotton jersey, cold machine wash.</p>
        <ProductPhotos imageIds={editor.imageIds} files={files} onImages={ids=>change('imageIds',ids)} onFiles={setFiles} onError={setFormError} disabled={busy} />
        <VariantBuilder variants={editor.variants} onChange={variants=>change('variants',variants)} onError={setFormError} />
        <h3>Sizes, colours & stock</h3>{editor.variants.map((v,i)=><div className="catalog-variant" key={v.id||`new-${i}`}><label>Size<input required maxLength={20} readOnly={!!v.id} value={v.size} onChange={e=>variantChange(i,'size',e.target.value)} /></label><label>Colour<input required maxLength={40} readOnly={!!v.id} value={v.colour} onChange={e=>variantChange(i,'colour',e.target.value)} /></label><label>Stock<input required type="number" min="0" max="1000000000" step="1" value={v.stock} onChange={e=>variantChange(i,'stock',e.target.value)} /></label>{!v.id&&<button type="button" disabled={editor.variants.length===1} onClick={()=>change('variants',editor.variants.filter((_,n)=>n!==i))}>Remove</button>}</div>)}
        <button type="button" disabled={editor.variants.length>=100} onClick={()=>change('variants',[...editor.variants,{size:'',colour:'',stock:0}])}>+ Add variant</button>
        {formError&&<p className="catalog-error" role="alert">{formError}</p>}
        <div className="catalog-actions"><button>{busy?'Saving…':'Save product'}</button><button type="button" onClick={()=>{setEditor(null);setFiles([]);setFormError('');}}>Cancel</button></div>
      </fieldset></form></div>}
    </main>
  </div>;
}
