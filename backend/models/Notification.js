
const {pool}=require('../config/database');
const {fail}=require('../utils/checkoutValidation');
// Called inside the order transaction. SMTP is never called here.
async function enqueue(c,orderId,historyId,status,customerId){
  const [orders]=await c.execute('SELECT order_number FROM orders WHERE id=?',[orderId]);
  const label=status.startsWith('return_')?'return / exchange request '+status.slice(7):status==='tracking_updated'?'courier tracking details updated':status;
  const message=`Order ${orders[0].order_number}: ${label}.`;
  await c.execute("INSERT INTO notifications (history_id,order_id,recipient_role,recipient_id,message) VALUES (?,?,'customer',?,?)",[historyId,orderId,customerId,message]);
  if(status==='placed')await c.execute("INSERT INTO notifications (history_id,order_id,recipient_role,recipient_id,message) SELECT ?,?,'seller',id,? FROM sellers WHERE is_active=TRUE",[historyId,orderId,`New order ${orders[0].order_number} received.`]);
  if(status==='return_requested')await c.execute("INSERT INTO notifications (history_id,order_id,recipient_role,recipient_id,message) SELECT ?,?,'seller',id,? FROM sellers WHERE is_active=TRUE",[historyId,orderId,message]);
  await c.execute('INSERT INTO order_email_jobs (history_id,order_id,event_status) VALUES (?,?,?)',[historyId,orderId,status]);
}
async function list(role,id,page=1){
  page=Number(page);if(!Number.isSafeInteger(page)||page<1||page>100000)fail('Invalid page.');
  const [counts]=await pool.execute('SELECT COUNT(*) total,COALESCE(SUM(read_at IS NULL),0) unread FROM notifications WHERE recipient_role=? AND recipient_id=?',[role,id]);
  const [items]=await pool.query('SELECT id,order_id,message,read_at,created_at FROM notifications WHERE recipient_role=? AND recipient_id=? ORDER BY id DESC LIMIT 15 OFFSET '+((page-1)*15),[role,id]);
  return {items,unread:Number(counts[0].unread),page,pages:Math.max(1,Math.ceil(counts[0].total/15))};
}
async function markRead(role,recipient,id){
  if(!/^\d+$/.test(String(id)))fail('Invalid notification.');
  const [result]=await pool.execute('UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND recipient_role=? AND recipient_id=?',[id,role,recipient]);
  if(!result.affectedRows)fail('Notification not found.',404);
}
module.exports={enqueue,list,markRead};
