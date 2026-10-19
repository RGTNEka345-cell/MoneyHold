
const crypto=require('crypto');
const {pool}=require('../config/database');
const Cart=require('./Cart');
const v=require('../utils/checkoutValidation');
const Notification=require('./Notification');

async function transaction(fn){
  const c=await pool.getConnection();
  try{
    // Current committed data after row locks: never price an order from an old snapshot.
    await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await c.beginTransaction();const result=await fn(c);await c.commit();return result;
  }catch(e){await c.rollback();if(['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(e.code))v.fail('Inventory is being updated. Retry with the same checkout request.',409);throw e;}finally{c.release();}
}
async function quote(customerId){return v.quote(await Cart.read(customerId),v.deliveryFee());}
async function lockProducts(c,ids){
  for(const id of [...new Set(ids)].sort((a,b)=>a-b))await c.execute('SELECT id FROM products WHERE id=? FOR UPDATE',[id]);
}
async function place(customerId,input){
  const data=v.request(input),requestHash=v.digest(data);
  return transaction(async c=>{
    await c.execute('SELECT id FROM customers WHERE id=? FOR UPDATE',[customerId]);
    const [existing]=await c.execute('SELECT id,request_hash FROM orders WHERE customer_id=? AND request_key=?',[customerId,data.requestKey]);
    if(existing.length){
      if(existing[0].request_hash!==requestHash)v.fail('This checkout request already created an order. Check My Orders before starting another checkout.',409);
      return {id:existing[0].id,replayed:true};
    }
    const fee=v.deliveryFee();
    const [variants]=await c.execute('SELECT v.id,v.product_id FROM carts c JOIN cart_items i ON i.cart_id=c.id JOIN product_variants v ON v.id=i.variant_id WHERE c.customer_id=?',[customerId]);
    // Match catalog's product-before-variant lock order, sorted across products.
    await lockProducts(c,variants.map(x=>x.product_id));
    for(const item of variants.sort((a,b)=>a.id-b.id))await c.execute('SELECT id FROM product_variants WHERE id=? FOR UPDATE',[item.id]);
    const current=v.quote(await Cart.read(customerId,c),fee);
    if(current.quoteToken!==data.quoteToken)v.fail('Your bag, prices or delivery fee changed. Review the updated summary before placing your order.',409);
    const d=data.delivery;
    const [result]=await c.execute(`INSERT INTO orders (order_number,customer_id,request_key,request_hash,recipient_name,phone,address_line1,address_line2,city,postal_code,subtotal_cents,delivery_cents,total_cents) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,['MH-'+crypto.randomBytes(8).toString('hex').toUpperCase(),customerId,data.requestKey,requestHash,d.name,d.phone,d.addressLine1,d.addressLine2,d.city,d.postalCode,current.subtotalCents,current.deliveryCents,current.totalCents]);
    for(const item of current.items){
      const [stock]=await c.execute('UPDATE product_variants SET stock=stock-? WHERE id=? AND stock>=?',[item.quantity,item.variant_id,item.quantity]);
      if(stock.affectedRows!==1)v.fail('Stock changed. Please review your bag.',409);
      await c.execute('INSERT INTO order_items (order_id,product_id,variant_id,product_name,size,colour,quantity,unit_price_cents,line_total_cents) VALUES (?,?,?,?,?,?,?,?,?)',[result.insertId,item.product_id,item.variant_id,item.name,item.size,item.colour,item.quantity,item.priceCents,item.lineTotalCents]);
    }
    for(const id of new Set(variants.map(x=>x.product_id)))await c.execute('UPDATE products SET version=version+1 WHERE id=?',[id]);
    const [history]=await c.execute("INSERT INTO order_status_history (order_id,status) VALUES (?,'placed')",[result.insertId]);
    await Notification.enqueue(c,result.insertId,history.insertId,'placed',customerId);
    await c.execute('DELETE i FROM cart_items i JOIN carts c ON c.id=i.cart_id WHERE c.customer_id=?',[customerId]);
    return {id:result.insertId,replayed:false};
  });
}
function validId(id){if(!/^\d+$/.test(String(id))||!Number.isSafeInteger(Number(id))||Number(id)<1)v.fail('Order not found.',404);return Number(id);}
async function detail(id,customerId){
  validId(id);
  const [rows]=await pool.execute('SELECT id,order_number,customer_id,recipient_name,phone,address_line1,address_line2,city,postal_code,country,payment_method,status,subtotal_cents,delivery_cents,total_cents,created_at,updated_at FROM orders WHERE id=?'+(customerId?' AND customer_id=?':''),customerId?[id,customerId]:[id]);
  if(!rows.length)v.fail('Order not found.',404);
  const [items]=await pool.execute('SELECT id,product_id,variant_id,product_name,size,colour,quantity,unit_price_cents,line_total_cents FROM order_items WHERE order_id=? ORDER BY id',[id]);
  const [history]=await pool.execute('SELECT status,created_at FROM order_status_history WHERE order_id=? ORDER BY id',[id]);
  const [tracking]=await pool.execute('SELECT courier_name,tracking_number,tracking_url,version,updated_at FROM order_tracking WHERE order_id=?',[id]);
  return {...rows[0],items,history,tracking:tracking[0]||null};
}
async function list(customerId,page=1){
  page=Number(page);if(!Number.isSafeInteger(page)||page<1||page>100000)v.fail('Invalid page.');
  const where=customerId?' WHERE customer_id=?':'',args=customerId?[customerId]:[];
  const [counts]=await pool.execute('SELECT COUNT(*) total FROM orders'+where,args);
  const [orders]=await pool.query('SELECT id,order_number,recipient_name,status,total_cents,created_at FROM orders'+where+' ORDER BY id DESC LIMIT 20 OFFSET '+((page-1)*20),args);
  return {orders,page,pages:Math.max(1,Math.ceil(counts[0].total/20)),total:counts[0].total};
}
async function findRequest(customerId,key){
  if(!/^[a-zA-Z0-9_-]{16,64}$/.test(key))v.fail('Invalid request key.');
  const [rows]=await pool.execute('SELECT id FROM orders WHERE customer_id=? AND request_key=?',[customerId,key]);
  if(!rows.length)v.fail('Order not found.',404);return rows[0];
}
async function changeStatus(id,sellerId,status,expectedStatus){
  validId(id);
  if(!Object.hasOwn(v.transitions,status))v.fail('Invalid order status.');
  return transaction(async c=>{
    const [orders]=await c.execute('SELECT customer_id,status FROM orders WHERE id=? FOR UPDATE',[id]);
    const order=orders[0];if(!order)v.fail('Order not found.',404);
    if(order.status!==expectedStatus)v.fail('Order status changed. Refresh before updating.',409);
    if(!v.transitions[order.status].includes(status))v.fail('This status change is not allowed.',409);
    if(status==='cancelled'){
      const [items]=await c.execute('SELECT variant_id,product_id,quantity FROM order_items WHERE order_id=? ORDER BY variant_id',[id]);
      if(items.some(i=>!i.variant_id||!i.product_id))v.fail('An ordered variant was deleted. Contact support to reconcile stock before cancellation.',409);
      await lockProducts(c,items.map(i=>i.product_id));
      for(const item of items)await c.execute('UPDATE product_variants SET stock=stock+? WHERE id=?',[item.quantity,item.variant_id]);
      for(const productId of new Set(items.map(i=>i.product_id)))await c.execute('UPDATE products SET version=version+1 WHERE id=?',[productId]);
    }
    await c.execute('UPDATE orders SET status=? WHERE id=?',[status,id]);
    const [history]=await c.execute('INSERT INTO order_status_history (order_id,status,seller_id) VALUES (?,?,?)',[id,status,sellerId]);
    await Notification.enqueue(c,id,history.insertId,status,order.customer_id);
    return order.customer_id;
  });
}
module.exports={quote,place,detail,list,findRequest,changeStatus};
