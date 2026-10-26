require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {test}=require('node:test'),assert=require('node:assert/strict'),mysql=require('mysql2/promise'),fs=require('fs'),path=require('path'),bcrypt=require('bcryptjs');
test('reset tokens: cooldown, expiry, single use, hashing and session revocation',async()=>{
 const dbName='money_hold_reset_test_'+Date.now();
 const admin=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
 await admin.query('CREATE DATABASE `'+dbName+'`');process.env.DB_NAME=dbName;
 const {pool}=require('../config/database');
 try{
  await pool.query('CREATE TABLE customers (id BIGINT UNSIGNED PRIMARY KEY,email VARCHAR(191) UNIQUE,password_hash VARCHAR(255),email_verified BOOLEAN,is_active BOOLEAN) ENGINE=InnoDB');
  await pool.query("INSERT INTO customers VALUES (1,'one@example.test','old',TRUE,TRUE),(2,'two@example.test','old',FALSE,TRUE),(3,'three@example.test','old',TRUE,FALSE)");
  for(const table of ['customer_sessions','password_resets'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
  const Reset=require('../models/PasswordReset');
  for(const email of ['absent@example.test','two@example.test','three@example.test'])assert.equal(await Reset.issue(email),null);
  let record=await Reset.issue('one@example.test');assert.equal(record.token.length,64);
  assert.notEqual((await pool.query('SELECT token_hash FROM password_resets'))[0][0].token_hash,record.token);
  assert.equal(await Reset.issue('one@example.test'),null);
  const input={token:record.token,password:'NewSecurePass123!',confirmPassword:'NewSecurePass123!'};
  await assert.rejects(()=>Reset.consume({...input,confirmPassword:'different'}),e=>e.status===422);
  await assert.rejects(()=>Reset.consume({...input,password:'short',confirmPassword:'short'}),e=>e.status===422);
  await pool.query('UPDATE password_resets SET expires_at=DATE_SUB(NOW(),INTERVAL 1 SECOND),requested_at=DATE_SUB(NOW(),INTERVAL 2 MINUTE)');
  await assert.rejects(()=>Reset.consume(input),e=>e.status===400);
  record=await Reset.issue('one@example.test');await assert.rejects(()=>Reset.consume(input),e=>e.status===400);
  await pool.execute('INSERT INTO customer_sessions (customer_id,token_hash,expires_at) VALUES (1,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))',['a'.repeat(64)]);
  const results=await Promise.allSettled([Reset.consume({...input,token:record.token}),Reset.consume({...input,token:record.token})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await pool.query('SELECT * FROM customer_sessions'))[0].length,0);
  assert.equal((await pool.query('SELECT * FROM password_resets'))[0].length,0);
  const passwordHash=(await pool.query('SELECT password_hash FROM customers WHERE id=1'))[0][0].password_hash;assert.equal(await bcrypt.compare(input.password,passwordHash),true);
 }finally{await pool.end();if(/^money_hold_reset_test_\d+$/.test(dbName))await admin.query('DROP DATABASE `'+dbName+'`');await admin.end();}
});
