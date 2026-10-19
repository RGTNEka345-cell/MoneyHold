const crypto=require('crypto');
const {pool}=require('../config/database');
const Order=require('../models/Order');
const mailer=require('../utils/mailer');
const {render}=require('../utils/orderEmail');
const MAX_ATTEMPTS=5;
async function runOne(send=mailer.sendMail){
  // Recover final-attempt workers that died while holding a lease.
  await pool.query("UPDATE order_email_jobs SET status='failed',last_error='LEASE_EXPIRED',lease_token=NULL,lease_until=NULL WHERE status='processing' AND lease_until<NOW() AND attempts>=5");
  const token=crypto.randomBytes(32).toString('hex');
  const [claim]=await pool.execute(`UPDATE order_email_jobs SET status='processing',lease_token=?,lease_until=DATE_ADD(NOW(),INTERVAL 5 MINUTE),attempts=attempts+1 WHERE attempts<5 AND ((status='pending' AND available_at<=NOW()) OR (status='processing' AND lease_until<NOW())) ORDER BY id LIMIT 1`,[token]);
  if(!claim.affectedRows)return false;
  const [rows]=await pool.execute('SELECT * FROM order_email_jobs WHERE lease_token=?',[token]);const job=rows[0];
  try{
    if(String(process.env.MAIL_FALLBACK).toLowerCase()==='true'){
      await pool.execute("UPDATE order_email_jobs SET status='simulated',last_error='MAIL_FALLBACK_ENABLED',lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=?",[job.id,token]);return true;
    }
    const order=await Order.detail(job.order_id);
    const [customers]=await pool.execute('SELECT email FROM customers WHERE id=?',[order.customer_id]);
    if(!customers[0]?.email)throw Object.assign(new Error('Recipient missing'),{code:'RECIPIENT_MISSING'});
    await send({to:customers[0].email,...render(order,job.event_status),messageId:`<moneyhold-order-${job.order_id}-event-${job.history_id}@moneyhold.local>`});
    await pool.execute("UPDATE order_email_jobs SET status='sent',sent_at=NOW(),last_error=NULL,lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=?",[job.id,token]);
  }catch(error){
    const code=['EAUTH','ECONNECTION','ETIMEDOUT','EENVELOPE','RECIPIENT_MISSING'].includes(error.code)?error.code:'SEND_FAILED';
    const delay=Math.min(3600,60*2**(job.attempts-1));
    await pool.execute('UPDATE order_email_jobs SET status=?,last_error=?,available_at=DATE_ADD(NOW(),INTERVAL ? SECOND),lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=?',[job.attempts>=MAX_ATTEMPTS?'failed':'pending',code,delay,job.id,token]);
  }
  return true;
}
function start(){
  let running=false,stopped=false;
  const tick=async()=>{if(running||stopped)return;running=true;try{for(let n=0;n<10&&!stopped;n++){if(!await runOne())break;}}catch{console.error('Order email worker unavailable. Check database migrations/connectivity.');}finally{running=false;}};
  const timer=setInterval(tick,15000);timer.unref();tick();return()=>{stopped=true;clearInterval(timer);};
}
module.exports={runOne,start};
