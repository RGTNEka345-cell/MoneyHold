require('dotenv').config({ path: require('path').join(__dirname,'../.env'), quiet: true });
const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const validate = require('../utils/catalogValidation');

test('catalog rejects duplicate variants, negative stock and invalid prices', () => {
  const data={name:'Test',description:'Test',categoryId:1,price:'100.00',active:false,variants:[{size:'M',colour:'Black',stock:3}]};
  assert.equal(validate.product(data).price,'100.00');
  assert.throws(()=>validate.product({...data,price:'1.001'}));
  assert.throws(()=>validate.product({...data,variants:[{size:'M',colour:'Black',stock:-1}]}));
  assert.throws(()=>validate.product({...data,variants:[...data.variants,{size:'m',colour:'black',stock:0}]}));
});

test('catalog HTTP persistence, image processing, conflict protection and stock', async () => {
  const dbName = 'money_hold_catalog_test_' + Date.now();
  const admin = await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||process.env.DB_PASS||''});
  await admin.query('CREATE DATABASE `' + dbName + '`');
  process.env.DB_NAME=dbName;
  const {pool}=require('../config/database');
  const Seller=require('../models/Seller');
  const oldSession=Seller.session;
  Seller.session=async()=>({id:1,name:'Test seller',email:'test@example.test'});
  let server;
  try {
    for(const name of ['categories','products','product_variants','product_images']) await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${name}_table.sql`),'utf8'));
    server=require('../index').listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}/api/seller`;
    const call=(url,body,method='GET',auth=true)=>fetch(base+url,{method,headers:{Origin:(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0],...(auth?{Cookie:'money_hold_seller='+'a'.repeat(64)}:{}),...(body && !(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
    assert.equal((await call('/products',null,'GET',false)).status,401);
    assert.equal((await call('/categories',{name:'Tees',description:'Test'},'POST')).status,200);
    assert.equal((await call('/categories',{name:'Tees',description:''},'POST')).status,409);
    const category=(await (await call('/categories')).json()).categories[0];
    assert.equal((await call(`/categories/${category.id}`,{name:'T-shirts',description:'Updated',version:category.version},'PUT')).status,200);
    const image=await sharp({create:{width:5,height:5,channels:3,background:'red'}}).png().toBuffer();
    const payload={name:'Signature Tee',description:'Cotton tee',categoryId:category.id,price:'4500.00',active:true,variants:[{size:'M',colour:'Black',stock:10}],imageIds:[]};
    function form(data,photo) {const f=new FormData();f.append('payload',JSON.stringify(data));if(photo)f.append('images',new Blob([photo],{type:'image/png'}),'test.png');return f;}
    assert.equal((await call('/products',form(payload,Buffer.from('not an image')),'POST')).status,422);
    assert.equal((await call('/products',form(payload,image),'POST')).status,200);
    let product=(await (await call('/products')).json()).products[0];
    assert.equal(product.variants[0].stock,10);
    const photo=await call(`/images/${product.images[0].id}`);
    assert.equal(photo.headers.get('content-type'),'image/jpeg');
    const update={...payload,version:product.version,variants:product.variants,imageIds:product.images.map(x=>x.id),price:'4600.00'};
    assert.equal((await call(`/products/${product.id}`,form(update),'PUT')).status,200);
    assert.equal((await call(`/products/${product.id}`,form(update),'PUT')).status,409);
    product=(await (await call('/products')).json()).products[0];
    assert.equal(Number(product.price),4600);
    assert.equal((await call(`/products/${product.id}/variants/${product.variants[0].id}/stock`,{version:product.version,stock:0},'PATCH')).status,200);
    assert.equal((await call(`/products/${product.id}/variants/${product.variants[0].id}/stock`,{version:product.version,stock:5},'PATCH')).status,409);
    product=(await (await call('/products')).json()).products[0];
    assert.equal(product.variants[0].stock,0);
    assert.equal((await call(`/products/${product.id}`,form({...update,version:product.version,categoryId:999999}),'PUT')).status,422);
    assert.equal((await (await call('/products')).json()).products.length,1);
    const shop = url => fetch(base.replace('/seller','/shop')+url);
    let listing=await (await shop('/products?q=Signature&sort=price_asc')).json();
    assert.equal(listing.total,1);
    assert.equal(listing.products[0].name,'Signature Tee');
    assert.equal((await (await shop('/products?stock=true')).json()).total,0);
    assert.equal((await (await shop('/products?q=missing')).json()).total,0);
    assert.equal((await (await shop('/products?category='+category.id)).json()).total,1);
    assert.equal((await shop('/products?category=bad')).status,422);
    assert.equal((await (await shop('/products/'+product.id)).json()).product.variants[0].stock,0);
    assert.equal((await shop('/images/'+product.images[0].id)).status,200);
    assert.equal((await (await shop('/categories')).json()).categories.length,1);
    const streamController=new AbortController();
    const stream=await fetch(base.replace('/seller','/shop')+'/events',{signal:streamController.signal});
    const reader=stream.body.getReader();
    assert.match(new TextDecoder().decode((await reader.read()).value),/data: catalog/);
    assert.equal((await call(`/products/${product.id}`,form({...update,version:product.version,active:false}),'PUT')).status,200);
    assert.match(new TextDecoder().decode((await reader.read()).value),/data: catalog/);
    streamController.abort();
    assert.equal((await (await shop('/products')).json()).total,0);
    assert.equal((await shop('/products/'+product.id)).status,404);
    assert.equal((await shop('/images/'+product.images[0].id)).status,404);
    assert.equal((await (await shop('/categories')).json()).categories.length,0);
  } finally {
    Seller.session=oldSession;
    if(server) await new Promise(resolve=>server.close(resolve));
    await pool.end();
    if(!/^money_hold_catalog_test_[0-9]+$/.test(dbName))throw Error('Unsafe test database name');
    await admin.query('DROP DATABASE `' + dbName + '`');
    await admin.end();
  }
});
