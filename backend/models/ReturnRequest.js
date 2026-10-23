const {pool}=require('../config/database');
const {fail,digest}=require('../utils/checkoutValidation');
const Notification=require('./Notification');
const trackingValidation=require('../utils/trackingValidation');
const number=(value,label,min=1)=>{if(!Number.isSafeInteger(value)||value<min)fail(`Invalid ${label}.`);return value;};
function text(value,label){if(typeof value!=='string'||!value.trim()||value.trim().length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))fail(`Enter ${label} (up to 1000 characters).`);return value.trim();}
async function transaction(fn){const c=await pool.getConnection();try{await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');await c.beginTransaction();const result=await fn(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
async function event(c,order,requestId,status,note,sellerId=null){
  await c.execute('INSERT INTO return_history (return_id,status,note,seller_id) VALUES (?,?,?,?)',[requestId,status,note,sellerId]);
  const [history]=await c.execute('INSERT INTO order_status_history (order_id,status,seller_id) VALUES (?,?,?)',[order.id,'return_'+status,sellerId]);
  await Notification.enqueue(c,order.id,history.insertId,'return_'+status,order.customer_id);
}
async function create(orderId,customerId,input={}){
  number(Number(orderId),'order');
  const itemId=number(input.itemId,'order item'),quantity=number(input.quantity,'quantity');
  if(quantity>99)fail('Maximum 99 units per request.');
  if(!['return','exchange'].includes(input.kind))fail('Choose return or size exchange.');
  const reason=text(input.reason,'a reason');
  if(typeof input.requestKey!=='string'||!/^[a-zA-Z0-9_-]{16,64}$/.test(input.requestKey))fail('Invalid request key.');
  const replacement=input.kind==='exchange'?number(input.replacementVariantId,'replacement size'):null;
  const hash=digest({orderId:Number(orderId),itemId,quantity,kind:input.kind,reason,replacement});
  return transaction(async c=>{
    const [orders]=await c.execute('SELECT id,status,customer_id FROM orders WHERE id=? AND customer_id=? FOR UPDATE',[orderId,customerId]);
    const order=orders[0];if(!order)fail('Order not found.',404);
    const [existing]=await c.execute('SELECT id,request_hash FROM return_requests WHERE customer_id=? AND request_key=?',[customerId,input.requestKey]);
    if(existing.length){if(existing[0].request_hash!==hash)fail('This request key was already used. Refresh your order before submitting again.',409);return {id:existing[0].id,customerId,replayed:true};}
    if(order.status!=='delivered')fail('Returns and size exchanges are available only after delivery.',409);
    const [items]=await c.execute('SELECT * FROM order_items WHERE id=? AND order_id=?',[itemId,orderId]);const item=items[0];if(!item)fail('Order item not found.',404);
    const [used]=await c.execute("SELECT COALESCE(SUM(quantity),0) quantity FROM return_requests WHERE order_item_id=? AND status NOT IN ('rejected','cancelled')",[itemId]);
    if(quantity+Number(used[0].quantity)>item.quantity)fail('This quantity has already been requested or exceeds the delivered quantity.',409);
    let size=null;
    if(replacement){
      const [variants]=await c.execute('SELECT v.*,p.is_active FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=?',[replacement]);const variant=variants[0];
      if(!variant||!variant.is_active||variant.product_id!==item.product_id||variant.colour!==item.colour||variant.size===item.size)fail('Choose another size of the same product and colour.');
      if(variant.stock<quantity)fail('The requested size currently has insufficient stock.',409);size=variant.size;
    }
    const [result]=await c.execute('INSERT INTO return_requests (order_id,order_item_id,customer_id,request_key,request_hash,kind,quantity,reason,replacement_variant_id,replacement_size) VALUES (?,?,?,?,?,?,?,?,?,?)',[orderId,itemId,customerId,input.requestKey,hash,input.kind,quantity,reason,replacement,size]);
    await event(c,order,result.insertId,'requested',reason);
    return {id:result.insertId,customerId,replayed:false};
  });
}
async function change(orderId,requestId,sellerId,input={}){
  number(Number(orderId),'order');number(Number(requestId),'request');number(input.version,'version');
  const status=input.status,note=text(input.note,'a customer-visible note / return instructions');
  return transaction(async c=>{
    const [orders]=await c.execute('SELECT id,customer_id FROM orders WHERE id=? FOR UPDATE',[orderId]);const order=orders[0];if(!order)fail('Order not found.',404);
    const [requests]=await c.execute('SELECT r.*,i.product_id,i.variant_id,i.colour,i.size FROM return_requests r JOIN order_items i ON i.id=r.order_item_id WHERE r.id=? AND r.order_id=? FOR UPDATE',[requestId,orderId]);
    const r=requests[0];if(!r)fail('Return request not found.',404);
    if(r.version!==input.version)fail('This request changed. Refresh before updating.',409);
    const allowed={requested:['approved','rejected'],approved:['received'],received:r.kind==='exchange'?['dispatched']:['completed'],dispatched:['completed']};
    if(!allowed[r.status]?.includes(status))fail('This request status change is not allowed.',409);
    let restock=r.restock_quantity,tracking=null;
    if(status==='received'){
      if(input.inspected!==true)fail('Confirm the return parcel was received and inspected.');
      restock=number(input.restockQuantity,'resellable quantity',0);if(restock>r.quantity)fail('Resellable quantity exceeds the returned quantity.');
      if(restock){
        if(!r.product_id||!r.variant_id)fail('Original variant no longer exists. Reconcile inventory before restocking.',409);
        await c.execute('SELECT id FROM products WHERE id=? FOR UPDATE',[r.product_id]);
        const [stock]=await c.execute('UPDATE product_variants SET stock=stock+? WHERE id=? AND product_id=?',[restock,r.variant_id,r.product_id]);
        if(!stock.affectedRows)fail('Original variant no longer exists.',409);
        await c.execute('UPDATE products SET version=version+1 WHERE id=?',[r.product_id]);
      }
    }
    if(status==='dispatched'){
      if(!r.product_id||!r.replacement_variant_id)fail('Replacement variant no longer exists. Contact the customer to resolve this exchange.',409);
      tracking=trackingValidation({...input.tracking,version:0});
      const [products]=await c.execute('SELECT is_active FROM products WHERE id=? FOR UPDATE',[r.product_id]);
      const [variants]=await c.execute('SELECT * FROM product_variants WHERE id=? FOR UPDATE',[r.replacement_variant_id]);const variant=variants[0];
      if(!products[0]?.is_active||!variant||variant.product_id!==r.product_id||variant.colour!==r.colour||variant.size!==r.replacement_size)fail('Replacement is no longer available.',409);
      if(variant.stock<r.quantity)fail('Replacement size is out of stock. Keep this request open until stock is available.',409);
      await c.execute('UPDATE product_variants SET stock=stock-? WHERE id=?',[r.quantity,r.replacement_variant_id]);
      await c.execute('UPDATE products SET version=version+1 WHERE id=?',[r.product_id]);
    }
    if(status==='completed'&&input.confirmed!==true)fail(r.kind==='exchange'?'Confirm replacement delivery before closing.':'Confirm the return is closed. Refunds must be handled separately.');
    await c.execute('UPDATE return_requests SET status=?,seller_note=?,restock_quantity=?,courier_name=?,tracking_number=?,tracking_url=?,version=version+1 WHERE id=?',[status,note,restock,tracking?.courierName||r.courier_name,tracking?.trackingNumber||r.tracking_number,tracking?tracking.trackingUrl:r.tracking_url,requestId]);
    await event(c,order,requestId,status,note,sellerId);
    return {customerId:order.customer_id,stockChanged:status==='received'||status==='dispatched'};
  });
}
async function forOrder(orderId){
  const [requests]=await pool.execute('SELECT id,order_item_id,kind,quantity,reason,replacement_size,status,seller_note,restock_quantity,courier_name,tracking_number,tracking_url,version,created_at,updated_at FROM return_requests WHERE order_id=? ORDER BY id DESC',[orderId]);
  const [history]=await pool.execute('SELECT h.return_id,h.status,h.note,h.created_at FROM return_history h JOIN return_requests r ON r.id=h.return_id WHERE r.order_id=? ORDER BY h.id',[orderId]);
  const [options]=await pool.execute('SELECT i.id order_item_id,v.id,v.size,v.stock FROM order_items i JOIN products p ON p.id=i.product_id JOIN product_variants v ON v.product_id=i.product_id AND v.colour=i.colour AND v.size<>i.size WHERE i.order_id=? AND p.is_active=TRUE ORDER BY v.size',[orderId]);
  return {requests:requests.map(r=>({...r,history:history.filter(h=>h.return_id===r.id)})),options};
}
module.exports={create,change,forOrder};
