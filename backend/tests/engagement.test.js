require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {test}=require('node:test'),assert=require('node:assert/strict'),mysql=require('mysql2/promise'),fs=require('fs'),path=require('path');
test('wishlist isolation and verified purchase reviews',async()=>{
 const dbName='money_hold_engagement_test_'+Date.now();const admin=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
 await admin.query('CREATE DATABASE `'+dbName+'`');process.env.DB_NAME=dbName;const {pool}=require('../config/database'),Session=require('../models/CustomerSession'),{hash}=require('../utils/customerSession');const original=Session.find;let server;
 Session.find=async token=>({id:token===hash('a'.repeat(64))?1:2,first_name:'Customer'});
 try{
 await pool.query('CREATE TABLE customers (id BIGINT UNSIGNED PRIMARY KEY,first_name VARCHAR(60)) ENGINE=InnoDB');await pool.query("INSERT INTO customers VALUES (1,'One'),(2,'Two')");
 for(const table of ['categories','products','product_images'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
 await pool.query("INSERT INTO categories (name) VALUES ('Tees')");await pool.query("INSERT INTO products (category_id,name,description,price,is_active) VALUES (1,'Test Tee','Test',2500,TRUE),(1,'Hidden Tee','Test',2500,FALSE)");
 await pool.query('CREATE TABLE orders (id BIGINT UNSIGNED PRIMARY KEY,customer_id BIGINT UNSIGNED,status VARCHAR(30))');await pool.query("INSERT INTO orders VALUES (1,1,'delivered'),(2,2,'processing')");
 await pool.query('CREATE TABLE order_items (id BIGINT UNSIGNED PRIMARY KEY,order_id BIGINT UNSIGNED,product_id BIGINT UNSIGNED)');await pool.query('INSERT INTO order_items VALUES (1,1,1),(2,2,1)');
 for(const sql of fs.readFileSync(path.join(__dirname,'../migrations/create_product_engagement_tables.sql'),'utf8').split(';').filter(s=>s.trim()))await pool.query(sql);
 server=require('../index').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;
 const call=(url,method='GET',body,who='a')=>fetch(base+url,{method,headers:{Origin:(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0],'Content-Type':'application/json',...(who?{Cookie:'money_hold_customer='+who.repeat(64)}:{})},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await call('/customer/wishlist','GET',null,null)).status,401);
 for(let i=0;i<2;i++)assert.equal((await call('/customer/wishlist/1','PUT',{})).status,200);
 assert.equal((await (await call('/customer/wishlist')).json()).items.length,1);
 assert.equal((await (await call('/customer/wishlist','GET',null,'b')).json()).items.length,0);
 await call('/customer/wishlist/1','DELETE',{},'b');assert.equal((await (await call('/customer/wishlist')).json()).items.length,1);
 assert.equal((await call('/customer/wishlist/2','PUT',{})).status,404);
 const review={rating:5,body:'Excellent quality and fit.',version:0};
 assert.equal((await call('/customer/reviews/1','PUT',review,'b')).status,403);
 assert.equal((await call('/customer/reviews/1','PUT',{...review,rating:6})).status,422);
 assert.equal((await call('/customer/reviews/1','PUT',review)).status,200);
 assert.equal((await call('/customer/reviews/1','PUT',review)).status,409);
 let data=await (await call('/shop/products/1/reviews','GET',null,null)).json();assert.equal(data.total,1);assert.equal(Number(data.average),5);assert.equal(data.reviews[0].author,'One');assert.equal(data.reviews[0].customer_id,undefined);
 assert.equal((await call('/customer/reviews/1','PUT',{...review,rating:4,version:1})).status,200);
 await call('/customer/reviews/1','DELETE',{version:0},'b');data=await (await call('/shop/products/1/reviews')).json();assert.equal(data.total,1);
 assert.equal((await call('/customer/reviews/1','DELETE',{version:2})).status,200);assert.equal((await (await call('/shop/products/1/reviews')).json()).total,0);
 await call('/customer/wishlist/1','DELETE',{});assert.equal((await (await call('/customer/wishlist')).json()).items.length,0);
 }finally{Session.find=original;if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await pool.end();if(/^money_hold_engagement_test_\d+$/.test(dbName))await admin.query('DROP DATABASE `'+dbName+'`');await admin.end();}
});
