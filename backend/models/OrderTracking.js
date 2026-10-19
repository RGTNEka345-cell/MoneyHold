const {pool}=require('../config/database');
const validate=require('../utils/trackingValidation');
const {fail}=require('../utils/checkoutValidation');
const Notification=require('./Notification');
async function save(orderId,sellerId,input){
  if(!/^\d+$/.test(String(orderId)))fail('Order not found.',404);
  const data=validate(input),c=await pool.getConnection();
  try{
    await c.beginTransaction();
    const [orders]=await c.execute('SELECT customer_id,status FROM orders WHERE id=? FOR UPDATE',[orderId]);
    const order=orders[0];if(!order)fail('Order not found.',404);
    if(['cancelled','delivered'].includes(order.status))fail('Tracking cannot be edited after cancellation or delivery.',409);
    const [rows]=await c.execute('SELECT * FROM order_tracking WHERE order_id=?',[orderId]);const old=rows[0];
    if((old?.version||0)!==data.version)fail('Tracking details changed in another session. Reload the latest details before saving.',409);
    if(old&&old.courier_name===data.courierName&&old.tracking_number===data.trackingNumber&&old.tracking_url===data.trackingUrl){await c.commit();return {customerId:order.customer_id,changed:false};}
    if(old)await c.execute('UPDATE order_tracking SET courier_name=?,tracking_number=?,tracking_url=?,version=version+1,updated_by=? WHERE order_id=?',[data.courierName,data.trackingNumber,data.trackingUrl,sellerId,orderId]);
    else await c.execute('INSERT INTO order_tracking (order_id,courier_name,tracking_number,tracking_url,updated_by) VALUES (?,?,?,?,?)',[orderId,data.courierName,data.trackingNumber,data.trackingUrl,sellerId]);
    const [history]=await c.execute("INSERT INTO order_status_history (order_id,status,seller_id) VALUES (?,'tracking_updated',?)",[orderId,sellerId]);
    await Notification.enqueue(c,orderId,history.insertId,'tracking_updated',order.customer_id);
    await c.commit();return {customerId:order.customer_id,changed:true};
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={save};
