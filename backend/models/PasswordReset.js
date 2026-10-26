const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const {pool}=require('../config/database');
const {hash}=require('../utils/customerSession');
const {fail}=require('../utils/checkoutValidation');
async function issue(email){
 const c=await pool.getConnection();
 try{
  await c.beginTransaction();
  const [customers]=await c.execute('SELECT id,email FROM customers WHERE email=? AND is_active=TRUE AND email_verified=TRUE FOR UPDATE',[email]);
  if(!customers.length){await c.commit();return null;}
  const customer=customers[0];
  const [recent]=await c.execute('SELECT customer_id FROM password_resets WHERE customer_id=? AND requested_at>DATE_SUB(NOW(),INTERVAL 60 SECOND)',[customer.id]);
  if(recent.length){await c.commit();return null;}
  const token=crypto.randomBytes(32).toString('hex');
  await c.execute('INSERT INTO password_resets (customer_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE)) ON DUPLICATE KEY UPDATE token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),requested_at=NOW()',[customer.id,hash(token)]);
  await c.commit();return {...customer,token};
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
async function consume(input={}){
 const {token,password,confirmPassword}=input||{};
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail('This reset link is invalid or expired. Request a new link.',400);
 if(typeof password!=='string'||password.length<8||Buffer.byteLength(password,'utf8')>72||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))fail('Use at least 8 characters, a letter and a number (maximum 72 bytes).');
 if(password!==confirmPassword)fail('Passwords do not match.');
 const tokenHash=hash(token);
 const [records]=await pool.execute('SELECT customer_id FROM password_resets WHERE token_hash=? AND expires_at>NOW()',[tokenHash]);
 if(!records.length)fail('This reset link is invalid or expired. Request a new link.',400);
 const passwordHash=await bcrypt.hash(password,12),id=records[0].customer_id,c=await pool.getConnection();
 try{
  await c.beginTransaction();
  const [customers]=await c.execute('SELECT id FROM customers WHERE id=? AND is_active=TRUE AND email_verified=TRUE FOR UPDATE',[id]);
  const [valid]=await c.execute('SELECT customer_id FROM password_resets WHERE customer_id=? AND token_hash=? AND expires_at>NOW() FOR UPDATE',[id,tokenHash]);
  if(!customers.length||!valid.length)fail('This reset link is invalid or expired. Request a new link.',400);
  await c.execute('UPDATE customers SET password_hash=? WHERE id=?',[passwordHash,id]);
  await c.execute('DELETE FROM customer_sessions WHERE customer_id=?',[id]);
  await c.execute('DELETE FROM password_resets WHERE customer_id=?',[id]);
  await c.commit();
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={issue,consume};
