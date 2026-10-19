const { pool } = require('../config/database');
const sharp = require('sharp');
const validate = require('../utils/catalogValidation');
const events = require('../utils/catalogEvents');

function wrap(fn) { return async (req,res,next) => {
  try { await fn(req,res); } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That category or size/colour combination already exists.' });
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}; }
async function transaction(fn) {
  const c = await pool.getConnection();
  try { await c.beginTransaction(); const result = await fn(c); await c.commit(); return result; }
  catch(e) { await c.rollback(); throw e; } finally { c.release(); }
}
exports.categories = wrap(async (req,res) => {
  const [rows] = await pool.query('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id) product_count FROM categories c ORDER BY name');
  res.json({ categories: rows });
});
exports.saveCategory = wrap(async (req,res) => {
  const data = validate.category(req.body || {});
  if (req.params.id) {
    const version = validate.integer(req.body.version, 'version', 1);
    const [r] = await pool.execute('UPDATE categories SET name=?,description=?,version=version+1 WHERE id=? AND version=?', [data.name,data.description,req.params.id,version]);
    if (!r.affectedRows) validate.fail('Category changed or no longer exists. Reload before saving.',409);
  } else await pool.execute('INSERT INTO categories (name,description) VALUES (?,?)',[data.name,data.description]);
  events.emit('change'); res.json({ success: true });
});
exports.products = wrap(async (req,res) => {
  const [products] = await pool.query('SELECT p.*, c.name category_name FROM products p JOIN categories c ON c.id=p.category_id ORDER BY p.id DESC');
  const [variants] = await pool.query('SELECT * FROM product_variants ORDER BY id');
  const [images] = await pool.query('SELECT id,product_id FROM product_images ORDER BY id');
  res.json({ products: products.map(p => ({ ...p, variants: variants.filter(v => v.product_id===p.id), images: images.filter(i=>i.product_id===p.id) })) });
});
exports.saveProduct = wrap(async (req,res) => {
  let body;
  try { body = JSON.parse(req.body.payload); } catch { validate.fail('Invalid product form.'); }
  if (!body || typeof body !== 'object') validate.fail('Invalid product form.');
  const data = validate.product(body);
  const files = req.files || [];
  if (files.length + data.imageIds.length > 4) validate.fail('Use at most four product photos.');
  if (data.active && !files.length && !data.imageIds.length) validate.fail('Add a photo before making the product active.');
  const buffers = [];
  for (const file of files) {
    try { buffers.push(await sharp(file.buffer, { limitInputPixels: 25000000 }).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer()); }
    catch { validate.fail('A photo could not be read. Use a valid JPEG, PNG or WebP image.'); }
  }
  const id = await transaction(async c => {
    const [categories] = await c.execute('SELECT id FROM categories WHERE id=?',[data.categoryId]);
    if (!categories.length) validate.fail('Choose an existing category.');
    let id = req.params.id;
    let oldVariants = [], oldImages = [];
    if (id) {
      const [rows] = await c.execute('SELECT id,version FROM products WHERE id=? FOR UPDATE',[id]);
      if (!rows.length) validate.fail('Product not found.',404);
      if (rows[0].version !== body.version) validate.fail('This product changed in another tab. Reload it before saving.',409);
      [oldVariants] = await c.execute('SELECT * FROM product_variants WHERE product_id=?',[id]);
      [oldImages] = await c.execute('SELECT id FROM product_images WHERE product_id=?',[id]);
      await c.execute('UPDATE products SET name=?,description=?,price=?,category_id=?,is_active=?,version=version+1 WHERE id=?',[data.name,data.description,data.price,data.categoryId,data.active,id]);
    } else {
      const [r] = await c.execute('INSERT INTO products (name,description,price,category_id,is_active) VALUES (?,?,?,?,?)',[data.name,data.description,data.price,data.categoryId,data.active]);
      id = r.insertId;
    }
    if (data.imageIds.some(id => !oldImages.some(i=>i.id===id))) validate.fail('Invalid product photo.');
    const kept = new Set();
    for (const v of data.variants) {
      if (v.id) {
        const old = oldVariants.find(x=>x.id===v.id);
        if (!old || kept.has(v.id)) validate.fail('Invalid variant.');
        // Existing identities stay stable for future order references.
        if (old.size !== v.size || old.colour !== v.colour) validate.fail('For an existing variant, change stock only. Add a new variant for another size/colour.');
        kept.add(v.id);
        await c.execute('UPDATE product_variants SET stock=? WHERE id=?',[v.stock,v.id]);
      } else await c.execute('INSERT INTO product_variants (product_id,size,colour,stock) VALUES (?,?,?,?)',[id,v.size,v.colour,v.stock]);
    }
    if (oldVariants.some(v=>!kept.has(v.id))) validate.fail('Existing variants cannot be removed. Set stock to zero instead.');
    for (const image of oldImages) if (!data.imageIds.includes(image.id)) await c.execute('DELETE FROM product_images WHERE id=?',[image.id]);
    for (const buffer of buffers) await c.execute('INSERT INTO product_images (product_id,image_data) VALUES (?,?)',[id,buffer]);
    return id;
  });
  events.emit('change'); res.json({ success: true, id });
});
exports.stock = wrap(async (req,res) => {
  const stock = validate.integer(req.body?.stock, 'stock');
  const version = validate.integer(req.body?.version, 'version', 1);
  await transaction(async c => {
    const [rows] = await c.execute('SELECT version FROM products WHERE id=? FOR UPDATE',[req.params.id]);
    if (!rows.length) validate.fail('Product not found.',404);
    if (rows[0].version !== version) validate.fail('Stock changed. Reload and try again.',409);
    const [result] = await c.execute('UPDATE product_variants SET stock=? WHERE id=? AND product_id=?',[stock,req.params.variantId,req.params.id]);
    if (!result.affectedRows) validate.fail('Variant not found.',404);
    await c.execute('UPDATE products SET version=version+1 WHERE id=?',[req.params.id]);
  });
  events.emit('change'); res.json({ success: true });
});
exports.image = wrap(async (req,res) => {
  const [rows] = await pool.execute('SELECT image_data FROM product_images WHERE id=?',[req.params.id]);
  if (!rows.length) return res.sendStatus(404);
  res.set('Content-Type','image/jpeg').set('X-Content-Type-Options','nosniff').set('Cache-Control','private, max-age=3600').send(rows[0].image_data);
});
exports.events = (req,res) => {
  res.set({ 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', Connection:'keep-alive', 'X-Accel-Buffering':'no' });
  res.flushHeaders();
  const changed = () => res.write('data: catalog\n\n');
  changed(); events.on('change',changed);
  const timer = setInterval(()=>res.write(': heartbeat\n\n'),25000);
  // Reconnect regularly so seller authentication is rechecked.
  const expiry = setTimeout(()=>res.end(),60000);
  req.on('close',()=>{ clearInterval(timer); clearTimeout(expiry); events.off('change',changed); });
};
