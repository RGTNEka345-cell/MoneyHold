require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {test}=require('node:test'),assert=require('node:assert/strict'),mysql=require('mysql2/promise'),fs=require('fs'),path=require('path');
test('customer profiles and address books: ownership, conflicts, defaults and validation',async()=>{
  const dbName='money_hold_profile_test_'+Date.now();
  const admin=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
  await admin.query('CREATE DATABASE `'+dbName+'`');process.env.DB_NAME=dbName;
  const {pool}=require('../config/database');let server;
  try{
    await pool.query('CREATE TABLE customers (id BIGINT UNSIGNED PRIMARY KEY,first_name VARCHAR(60),last_name VARCHAR(60),email VARCHAR(191),phone VARCHAR(30) UNIQUE,email_verified BOOLEAN DEFAULT TRUE,is_active BOOLEAN DEFAULT TRUE) ENGINE=InnoDB');
    await pool.query("INSERT INTO customers (id,first_name,last_name,email,phone) VALUES (1,'First','Customer','one@example.test','0771234567'),(2,'Second','Customer','two@example.test','0777654321')");
    for(const table of ['customer_sessions','customer_addresses'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
    const Session=require('../models/CustomerSession'),{hash}=require('../utils/customerSession');
    await Session.create(1,hash('a'.repeat(64)),new Date(Date.now()+3600000));await Session.create(2,hash('b'.repeat(64)),new Date(Date.now()+3600000));
    server=require('../index').listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}/api/customer`;
    const call=(url,body,method=body?'POST':'GET',who='a')=>fetch(base+url,{method,headers:{Origin:(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0],'Content-Type':'application/json',...(who?{Cookie:'money_hold_customer='+who.repeat(64)}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const book=async()=> (await (await call('/addresses')).json()).addresses;
    assert.equal((await call('/profile',null,'GET',null)).status,401);
    let profile=await (await call('/profile')).json();assert.equal(profile.customer.email,'one@example.test');assert.equal(profile.customer.password_hash,undefined);
    const edit={firstName:'Updated',lastName:'Customer',phone:'077 123 4567',version:profile.version};
    assert.equal((await call('/profile',{...edit,email:'changed@example.test'},'PATCH')).status,422);
    assert.equal((await call('/profile',{...edit,phone:'0777654321'},'PATCH')).status,409);
    assert.equal((await call('/profile',edit,'PATCH')).status,200);
    assert.equal((await call('/profile',edit,'PATCH')).status,409);
    assert.equal((await (await call('/profile')).json()).customer.firstName,'Updated');
    const address={label:'Home',name:'Test Customer',phone:'0771234567',addressLine1:'10 Test Road',addressLine2:'',city:'Colombo',postalCode:'00100',country:'LK',isDefault:false,requestKey:'address_request_01'};
    assert.equal((await call('/addresses',{...address,country:'US'})).status,422);
    const creates=await Promise.all([call('/addresses',address),call('/addresses',{...address,requestKey:'address_request_02'})]);
    assert.deepEqual(creates.map(r=>r.status),[201,201]);let addresses=await book();assert.equal(addresses.length,2);assert.equal(addresses.filter(a=>a.isDefault).length,1);
    assert.equal((await call('/addresses',address)).status,201);assert.equal((await book()).length,2);
    assert.equal((await call('/addresses',{...address,city:'Kandy'})).status,409);
    let first=addresses[0],second=addresses[1];
    for(const [url,body,method] of [[`/addresses/${first.id}`,{...address,version:first.version},'PUT'],[`/addresses/${first.id}/default`,{version:first.version},'PATCH'],[`/addresses/${first.id}`,{version:first.version},'DELETE']])assert.equal((await call(url,body,method,'b')).status,404);
    assert.deepEqual((await (await call('/addresses',null,'GET','b')).json()).addresses,[]);
    assert.equal((await call(`/addresses/${second.id}/default`,{version:second.version},'PATCH')).status,200);
    assert.equal((await call(`/addresses/${first.id}`,{...address,version:first.version},'PUT')).status,409);
    addresses=await book();second=addresses.find(a=>a.id===second.id);assert.equal(second.isDefault,true);
    assert.equal((await call(`/addresses/${second.id}`,{...address,city:'Kandy',version:second.version},'PUT')).status,200);
    second=(await book()).find(a=>a.id===second.id);assert.equal(second.city,'Kandy');assert.equal(second.isDefault,true);
    assert.equal((await call(`/addresses/${second.id}`,{version:second.version},'DELETE')).status,200);
    addresses=await book();assert.equal(addresses.length,1);assert.equal(addresses[0].isDefault,true);
    for(let i=3;i<=11;i++)assert.equal((await call('/addresses',{...address,requestKey:'address_request_'+i})).status,201);
    assert.equal((await call('/addresses',{...address,requestKey:'address_request_12'})).status,409);
    assert.equal((await book()).filter(a=>a.isDefault).length,1);
  }finally{
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    await pool.end();if(/^money_hold_profile_test_\d+$/.test(dbName))await admin.query('DROP DATABASE `'+dbName+'`');await admin.end();
  }
});
