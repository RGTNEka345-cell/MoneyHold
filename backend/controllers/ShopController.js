const { pool } = require('../config/database');
const events = require('../utils/catalogEvents');
const wrap = fn => async (req,res,next) => { try { res.set('Cache-Control','no-store'); await fn(req,res); } catch(e) { next(e); } };
const validId = id => /^[1-9][0-9]{0,14}$/.test(String(id));
exports.list = wrap(async(req,res)=>{
  const q = typeof req.query.q==='string' ? req.query.q.trim().slice(0,100) : '';
  const category = req.query.category;
  const page = Math.min(10000,Math.max(1,parseInt(req.query.page,10)||1));
  const limit = 12;
  const params=[];
  let where='p.is_active=TRUE';
  if(q){where+=' AND (LOCATE(?,p.name)>0 OR LOCATE(?,p.description)>0)';params.push(q,q);}
  if(category){if(!validId(category))return res.status(422).json({message:'Invalid category.'});where+=' AND p.category_id=?';params.push(category);}
  if(req.query.stock==='true')where+=' AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id=p.id AND v.stock>0)';
  const sort={newest:'p.id DESC',price_asc:'p.price ASC,p.id DESC',price_desc:'p.price DESC,p.id DESC'}[req.query.sort]||'p.id DESC';
  const [count]=await pool.execute(`SELECT COUNT(*) total FROM products p WHERE ${where}`,params);
  const [products]=await pool.execute(`SELECT p.id,p.name,p.price,p.category_id,c.name category_name,
    (SELECT MIN(i.id) FROM product_images i WHERE i.product_id=p.id) image_id,
    COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id=p.id),0) stock
    FROM products p JOIN categories c ON c.id=p.category_id WHERE ${where} ORDER BY ${sort} LIMIT ${limit} OFFSET ${(page-1)*limit}`,params);
  res.json({products,page,total:count[0].total,pages:Math.ceil(count[0].total/limit)});
});
exports.categories = wrap(async(req,res)=>{
  const [categories]=await pool.query('SELECT c.id,c.name,COUNT(p.id) product_count FROM categories c JOIN products p ON p.category_id=c.id AND p.is_active=TRUE GROUP BY c.id,c.name ORDER BY c.name');
  res.json({categories});
});
exports.detail = wrap(async(req,res)=>{
  if(!validId(req.params.id))return res.status(404).json({message:'Product unavailable.'});
  const [rows]=await pool.execute('SELECT p.id,p.name,p.description,p.price,p.category_id,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=? AND p.is_active=TRUE',[req.params.id]);
  if(!rows.length)return res.status(404).json({message:'This product is no longer available.'});
  const [variants]=await pool.execute('SELECT id,size,colour,stock FROM product_variants WHERE product_id=? ORDER BY id',[req.params.id]);
  const [images]=await pool.execute('SELECT id FROM product_images WHERE product_id=? ORDER BY id',[req.params.id]);
  res.json({product:{...rows[0],variants,images}});
});
exports.image = wrap(async(req,res)=>{
  if(!validId(req.params.id))return res.sendStatus(404);
  const [rows]=await pool.execute('SELECT i.image_data FROM product_images i JOIN products p ON p.id=i.product_id WHERE i.id=? AND p.is_active=TRUE',[req.params.id]);
  if(!rows.length)return res.sendStatus(404);
  res.set('Content-Type','image/jpeg').set('X-Content-Type-Options','nosniff').send(rows[0].image_data);
});
exports.events = (req,res)=>{
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const change=()=>res.write('data: catalog\n\n');change();events.on('change',change);
  const timer=setInterval(()=>res.write(': heartbeat\n\n'),25000);
  const expiry=setTimeout(()=>res.end(),60000);
  req.on('close',()=>{clearInterval(timer);clearTimeout(expiry);events.off('change',change);});
};
