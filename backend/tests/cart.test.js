require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {test}=require('node:test');
const assert=require('node:assert/strict');
const mysql=require('mysql2/promise');
const fs=require('fs');
const path=require('path');

test('cart persistence, ownership, stock, current pricing and concurrent additions',async()=>{
  const dbName='money_hold_cart_test_'+Date.now();
  const admin=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
  await admin.query('CREATE DATABASE `'+dbName+'`');
  process.env.DB_NAME=dbName;
  const {pool}=require('../config/database');
  const Session=require('../models/CustomerSession');
  const {hash}=require('../utils/customerSession');
  const original=Session.find;
  Session.find=async token=>({id:token===hash('a'.repeat(64))?1:2,first_name:'Test',email:'test@example.test'});
  let server;
  try{
    await pool.query('CREATE TABLE customers (id BIGINT UNSIGNED PRIMARY KEY) ENGINE=InnoDB');
    await pool.query('INSERT INTO customers VALUES (1),(2)');
    for(const table of ['categories','products','product_variants','product_images','carts','cart_items'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
    await pool.query("INSERT INTO categories (name) VALUES ('Tees')");
    await pool.query("INSERT INTO products (category_id,name,description,price,is_active) VALUES (1,'Signature Tee','Test',2500.25,1)");
    await pool.query("INSERT INTO product_variants (product_id,size,colour,stock) VALUES (1,'M','Black',10),(1,'L','Black',0)");
    server=require('../index').listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}/api/customer/cart`;
    const call=(url='',method='GET',body,customer='a')=>fetch(base+url,{method,headers:{Origin:(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0],'Content-Type':'application/json',...(customer?{Cookie:'money_hold_customer='+customer.repeat(64)}:{})},...(body?{body:JSON.stringify(body)}:{})});
    assert.equal((await call('','GET',null,null)).status,401);
    for(const quantity of [0,-1,1.5,'2',100])assert.equal((await call('/items','POST',{variantId:1,quantity})).status,422);
    assert.equal((await call('/items','POST',{variantId:2,quantity:1})).status,409);
    assert.equal((await call('/items','POST',{variantId:1,quantity:2,price:1})).status,200);
    let cart=await (await call()).json();
    assert.equal(cart.count,2);assert.equal(cart.subtotalCents,500050);
    const itemId=cart.items[0].id;
    assert.equal((await (await call('','GET',null,'b')).json()).count,0);
    assert.equal((await call('/items/'+itemId,'PATCH',{quantity:1},'b')).status,404);
    assert.equal((await call('/items/'+itemId,'DELETE',null,'b')).status,404);
    const additions=await Promise.all([call('/items','POST',{variantId:1,quantity:2}),call('/items','POST',{variantId:1,quantity:3})]);
    assert.ok(additions.every(r=>r.status===200));
    cart=await (await call()).json();assert.equal(cart.count,7);assert.equal(cart.items.length,1);
    assert.equal((await call('/items','POST',{variantId:1,quantity:4})).status,409);
    assert.equal((await pool.query('SELECT stock FROM product_variants WHERE id=1'))[0][0].stock,10);
    await pool.query('UPDATE products SET price=3000 WHERE id=1');
    await pool.query('UPDATE product_variants SET stock=2 WHERE id=1');
    cart=await (await call()).json();assert.equal(cart.subtotalCents,2100000);assert.equal(cart.hasUnavailableItems,true);
    assert.equal((await call('/items/'+itemId,'PATCH',{quantity:2})).status,200);
    await pool.query('UPDATE products SET is_active=0 WHERE id=1');
    assert.equal((await call('/items','POST',{variantId:1,quantity:1})).status,409);
    assert.equal((await (await call()).json()).hasUnavailableItems,true);
    // A private SSE connection receives catalog/cart invalidations without page refresh.
    const controller=new AbortController();
    const stream=await fetch(base+'/events',{headers:{Cookie:'money_hold_customer='+'a'.repeat(64)},signal:controller.signal});
    assert.equal(stream.status,200);
    const reader=stream.body.getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value),/data: cart/);
    require('../utils/catalogEvents').emit('change');
    assert.match(new TextDecoder().decode((await reader.read()).value),/data: cart/);
    controller.abort();
    assert.equal((await call('/items/'+itemId,'DELETE')).status,200);
    assert.equal((await (await call()).json()).count,0);
  }finally{
    Session.find=original;
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    await pool.end();
    assert.match(dbName,/^money_hold_cart_test_\d+$/);
    await admin.query('DROP DATABASE `'+dbName+'`');await admin.end();
  }
});
