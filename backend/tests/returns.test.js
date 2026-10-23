require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {test}=require('node:test'),assert=require('node:assert/strict'),mysql=require('mysql2/promise'),fs=require('fs'),path=require('path');
test('returns / size exchanges: ownership, lifecycle, quantity limits, atomic restock and dispatch',async()=>{
  const dbName='money_hold_returns_test_'+Date.now();
  const admin=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
  await admin.query('CREATE DATABASE `'+dbName+'`');process.env.DB_NAME=dbName;
  const {pool}=require('../config/database'),Session=require('../models/CustomerSession'),Seller=require('../models/Seller'),{hash}=require('../utils/customerSession');
  const oldFind=Session.find,oldSeller=Seller.session;
  Session.find=async token=>({id:token===hash('a'.repeat(64))?1:2,first_name:'Customer',email:'test@example.test'});Seller.session=async()=>({id:1,name:'Seller'});
  let server;
  try{
    await pool.query('CREATE TABLE customers (id BIGINT UNSIGNED PRIMARY KEY,email VARCHAR(191)) ENGINE=InnoDB');await pool.query("INSERT INTO customers VALUES (1,'one@example.test'),(2,'two@example.test')");
    await pool.query('CREATE TABLE sellers (id BIGINT UNSIGNED PRIMARY KEY,is_active BOOLEAN DEFAULT TRUE) ENGINE=InnoDB');await pool.query('INSERT INTO sellers (id) VALUES (1)');
    for(const table of ['categories','products','product_variants','product_images','carts','cart_items','orders','order_items','order_status_history','notifications','order_email_jobs','order_tracking','return_requests','return_history'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
    await pool.query("INSERT INTO categories (name) VALUES ('Tees')");
    await pool.query("INSERT INTO products (category_id,name,description,price,is_active) VALUES (1,'Signature Tee','Test',2500,1),(1,'Other Tee','Test',3000,1)");
    await pool.query("INSERT INTO product_variants (product_id,size,colour,stock) VALUES (1,'M','Black',10),(1,'L','Black',5),(1,'L','White',5),(2,'L','Black',5)");
    await pool.query("INSERT INTO orders (order_number,customer_id,request_key,request_hash,recipient_name,phone,address_line1,city,status,subtotal_cents,delivery_cents,total_cents) VALUES ('MH-RETURN',1,'original_order_key','hash','Test','0771234567','Road','Colombo','delivered',1000000,35000,1035000),('MH-NOTDELIVERED',1,'original_order_key2','hash','Test','0771234567','Road','Colombo','processing',250000,35000,285000)");
    await pool.query("INSERT INTO order_items (order_id,product_id,variant_id,product_name,size,colour,quantity,unit_price_cents,line_total_cents) VALUES (1,1,1,'Signature Tee','M','Black',4,250000,1000000),(2,1,1,'Signature Tee','M','Black',1,250000,250000)");
    const app=require('../index');app.set('trust proxy',1); // Test-only proxy: isolate each case's rate-limit bucket.
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}/api`;
    let client=0;
    const call=(url,body,who='a',seller=false,method=body?'POST':'GET')=>fetch(base+(seller?'/seller':'/customer')+url,{method,headers:{'X-Forwarded-For':'192.0.2.'+(++client),Origin:(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0],'Content-Type':'application/json',...(who?{Cookie:(seller?'money_hold_seller=':'money_hold_customer=')+who.repeat(64)}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const stock=async id=>(await pool.execute('SELECT stock FROM product_variants WHERE id=?',[id]))[0][0].stock;
    const request={itemId:1,kind:'exchange',quantity:2,replacementVariantId:2,reason:'Need a larger size',requestKey:'exchange_request_01'};
    assert.equal((await call('/orders/1/returns',request,null)).status,401);
    assert.equal((await call('/orders/1/returns',request,'b')).status,404);
    assert.equal((await call('/orders/2/returns',{...request,itemId:2})).status,409);
    for(const replacementVariantId of [1,3,4,999])assert.equal((await call('/orders/1/returns',{...request,replacementVariantId})).status,422);
    for(const quantity of [0,-1,1.2,'2',100])assert.equal((await call('/orders/1/returns',{...request,quantity})).status,422);
    const responses=await Promise.all([call('/orders/1/returns',request),call('/orders/1/returns',request)]);
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);const a=await responses[0].json(),b=await responses[1].json();assert.equal(a.id,b.id);const id=a.id;
    assert.equal(await stock(1),10);assert.equal(await stock(2),5);
    assert.equal((await (await call('/notifications',null,'a',true)).json()).unread,1);
    assert.equal((await call('/orders/1/returns',{...request,quantity:3,requestKey:'over_limit_request'})).status,409);
    const update=(status,version,extra={})=>call('/orders/1/returns/'+id,{status,version,note:'Store note\nNext instructions',...extra},'a',true,'PATCH');
    assert.equal((await call('/orders/1/returns/'+id,{status:'approved',version:1,note:'ok'},'a',false,'PATCH')).status,404);
    assert.equal((await update('received',1,{inspected:true,restockQuantity:2})).status,409);
    assert.equal((await update('approved',1)).status,200);assert.equal(await stock(1),10);
    assert.equal((await update('approved',1)).status,409);
    assert.equal((await update('received',2,{restockQuantity:2})).status,422);
    assert.equal((await update('received',2,{inspected:true,restockQuantity:3})).status,422);
    // Failure after the stock write must roll back both inventory and request state.
    await pool.query("CREATE TRIGGER reject_return_history BEFORE INSERT ON return_history FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Test rollback'");
    const Return=require('../models/ReturnRequest');
    await assert.rejects(()=>Return.change(1,id,1,{status:'received',version:2,note:'Inspection',inspected:true,restockQuantity:1}));assert.equal(await stock(1),10);
    await pool.query('DROP TRIGGER reject_return_history');
    const received=await Promise.all([update('received',2,{inspected:true,restockQuantity:1}),update('received',2,{inspected:true,restockQuantity:1})]);assert.deepEqual(received.map(r=>r.status).sort(),[200,409]);assert.equal(await stock(1),11);
    await pool.query('UPDATE product_variants SET stock=1 WHERE id=2');
    const tracking={courierName:'Courier',trackingNumber:'REPLACE123',trackingUrl:''};
    assert.equal((await update('dispatched',3,{tracking})).status,409);assert.equal(await stock(2),1);
    await pool.query('UPDATE product_variants SET stock=5 WHERE id=2');
    const dispatched=await Promise.all([update('dispatched',3,{tracking}),update('dispatched',3,{tracking})]);assert.deepEqual(dispatched.map(r=>r.status).sort(),[200,409]);assert.equal(await stock(2),3);
    assert.equal((await update('completed',4)).status,422);assert.equal((await update('completed',4,{confirmed:true})).status,200);assert.equal(await stock(1),11);
    const detail=(await (await call('/orders/1')).json()).order;
    assert.equal(detail.status,'delivered');assert.equal(detail.total_cents,1035000);assert.equal(detail.returns.requests[0].status,'completed');assert.equal(detail.returns.requests[0].history.length,5);
    assert.equal((await call('/orders/1',null,'b')).status,404);
    // Rejecting a request releases its quota; inspection of damaged goods adds no stock.
    const ret={itemId:1,kind:'return',quantity:2,reason:'Damaged item',requestKey:'return_request_001'};
    const rid=(await (await call('/orders/1/returns',ret)).json()).id;
    const changeRet=(requestId,status,version,extra={})=>call('/orders/1/returns/'+requestId,{status,version,note:'Store decision',...extra},'a',true,'PATCH');
    assert.equal((await changeRet(rid,'rejected',1)).status,200);
    const rid2=(await (await call('/orders/1/returns',{...ret,requestKey:'return_request_002'})).json()).id;
    assert.equal((await changeRet(rid2,'approved',1)).status,200);
    assert.equal((await changeRet(rid2,'received',2,{inspected:true,restockQuantity:0})).status,200);assert.equal(await stock(1),11);
    assert.equal((await changeRet(rid2,'completed',3,{confirmed:true})).status,200);
    assert.equal((await call('/orders/1/returns',{...ret,quantity:1,requestKey:'return_request_003'})).status,409);
    const historyCount=(await pool.query('SELECT COUNT(*) n FROM return_history'))[0][0].n;
    assert.equal((await pool.query('SELECT COUNT(*) n FROM order_email_jobs'))[0][0].n,historyCount);
  }finally{
    Session.find=oldFind;Seller.session=oldSeller;
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    await pool.end();assert.match(dbName,/^money_hold_returns_test_\d+$/);await admin.query('DROP DATABASE `'+dbName+'`');await admin.end();
  }
});
