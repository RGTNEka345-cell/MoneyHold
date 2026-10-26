const {pool}=require('../config/database');
const {fail}=require('../utils/checkoutValidation');
const events=require('../utils/catalogEvents');
const wrap=fn=>async(req,res,next)=>{try{res.set('Cache-Control','no-store');await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
function id(value){if(!/^[1-9]\d{0,14}$/.test(String(value)))fail('Product not found.',404);return Number(value);}
async function active(productId,c=pool){const [p]=await c.execute('SELECT id FROM products WHERE id=? AND is_active=TRUE',[productId]);if(!p.length)fail('Product unavailable.',404);}
async function eligible(customerId,productId,c=pool){const [rows]=await c.execute("SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.customer_id=? AND oi.product_id=? AND o.status='delivered' LIMIT 1",[customerId,productId]);return !!rows.length;}
exports.wishlist=wrap(async(req,res)=>{const [items]=await pool.execute('SELECT p.id,p.name,p.price,p.is_active,(SELECT MIN(i.id) FROM product_images i WHERE i.product_id=p.id) image_id FROM wishlist_items w JOIN products p ON p.id=w.product_id WHERE w.customer_id=? ORDER BY w.created_at DESC,p.id DESC',[req.customer.id]);res.json({items});});
exports.saveWishlist=wrap(async(req,res)=>{
 const productId=id(req.params.id),c=await pool.getConnection();
 try{await c.beginTransaction();await c.execute('SELECT id FROM customers WHERE id=? FOR UPDATE',[req.customer.id]);await active(productId,c);
 const [rows]=await c.execute('SELECT product_id FROM wishlist_items WHERE customer_id=?',[req.customer.id]);
 if(!rows.some(r=>r.product_id===productId)){if(rows.length>=100)fail('Your wishlist is full (100 items). Remove an item first.',409);await c.execute('INSERT INTO wishlist_items (customer_id,product_id) VALUES (?,?)',[req.customer.id,productId]);}
 await c.commit();}catch(e){await c.rollback();throw e;}finally{c.release();}
 events.emit('account:'+req.customer.id);res.json({saved:true});
});
exports.removeWishlist=wrap(async(req,res)=>{await pool.execute('DELETE FROM wishlist_items WHERE customer_id=? AND product_id=?',[req.customer.id,id(req.params.id)]);events.emit('account:'+req.customer.id);res.json({saved:false});});
exports.reviews=wrap(async(req,res)=>{
 const productId=id(req.params.id);await active(productId);const page=Math.min(10000,Math.max(1,parseInt(req.query.page,10)||1));
 const [summary]=await pool.execute('SELECT COUNT(*) total,COALESCE(AVG(rating),0) average FROM product_reviews WHERE product_id=?',[productId]);
 const [reviews]=await pool.execute(`SELECT r.id,r.rating,r.body,r.created_at,c.first_name author FROM product_reviews r JOIN customers c ON c.id=r.customer_id WHERE r.product_id=? ORDER BY r.id DESC LIMIT 10 OFFSET ${(page-1)*10}`,[productId]);
 res.json({reviews,...summary[0],page,pages:Math.ceil(summary[0].total/10)});
});
exports.mine=wrap(async(req,res)=>{const productId=id(req.params.id);await active(productId);const [rows]=await pool.execute('SELECT rating,body,version FROM product_reviews WHERE customer_id=? AND product_id=?',[req.customer.id,productId]);res.json({review:rows[0]||null,eligible:await eligible(req.customer.id,productId)});});
exports.changeReview=wrap(async(req,res)=>{
 const productId=id(req.params.id),{rating,body,version}=req.body||{},remove=req.method==='DELETE';
 if(!Number.isSafeInteger(version)||version<0)fail('Reload your review before saving.');
 if(!remove&&(!Number.isInteger(rating)||rating<1||rating>5||typeof body!=='string'||body.trim().length<5||body.trim().length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body)))fail('Choose 1–5 stars and write a review of 5–2000 characters.');
 const c=await pool.getConnection();
 try{await c.beginTransaction();await c.execute('SELECT id FROM customers WHERE id=? FOR UPDATE',[req.customer.id]);await active(productId,c);
 const [rows]=await c.execute('SELECT version FROM product_reviews WHERE customer_id=? AND product_id=? FOR UPDATE',[req.customer.id,productId]);
 if((rows[0]?.version||0)!==version)fail('Your review changed elsewhere. Reload before saving.',409);
 if(remove)await c.execute('DELETE FROM product_reviews WHERE customer_id=? AND product_id=?',[req.customer.id,productId]);
 else{if(!await eligible(req.customer.id,productId,c))fail('Reviews are available after your order is delivered.',403);
 await c.execute('INSERT INTO product_reviews (customer_id,product_id,rating,body) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),body=VALUES(body),version=version+1',[req.customer.id,productId,rating,body.trim()]);}
 await c.commit();}catch(e){await c.rollback();throw e;}finally{c.release();}
 events.emit('change');events.emit('account:'+req.customer.id);res.json({success:true});
});
