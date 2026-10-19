const {test}=require('node:test');
const assert=require('node:assert/strict');
const v=require('../utils/checkoutValidation');
const delivery={name:'Test Customer',phone:'0771234567',addressLine1:'10 Test Road',city:'Colombo'};
test('delivery validation rejects incomplete/invalid/foreign addresses',()=>{
  assert.equal(v.delivery(delivery).country,'LK');
  for(const input of [{...delivery,name:''},{...delivery,phone:'abc'},{...delivery,addressLine1:'x'.repeat(201)},{...delivery,country:'US'},null])assert.throws(()=>v.delivery(input));
});
test('delivery fee must be explicitly configured, including explicit free delivery',()=>{
  const old=process.env.CHECKOUT_DELIVERY_FEE_LKR;
  try{
    delete process.env.CHECKOUT_DELIVERY_FEE_LKR;assert.throws(()=>v.deliveryFee(),e=>e.status===503);
    for(const fee of ['','-1','1.001','NaN']){process.env.CHECKOUT_DELIVERY_FEE_LKR=fee;assert.throws(()=>v.deliveryFee());}
    process.env.CHECKOUT_DELIVERY_FEE_LKR='0';assert.equal(v.deliveryFee(),0);
    process.env.CHECKOUT_DELIVERY_FEE_LKR='350.50';assert.equal(v.deliveryFee(),35050);
  }finally{if(old===undefined)delete process.env.CHECKOUT_DELIVERY_FEE_LKR;else process.env.CHECKOUT_DELIVERY_FEE_LKR=old;}
});
test('quote identifies price, quantity and fee changes; rejects empty/unavailable carts',()=>{
  const cart={items:[{variant_id:1,quantity:2,priceCents:10000}],subtotalCents:20000,hasUnavailableItems:false};
  const q=v.quote(cart,35000);assert.equal(q.totalCents,55000);
  assert.notEqual(q.quoteToken,v.quote({...cart,items:[{variant_id:1,quantity:2,priceCents:20000}]},35000).quoteToken);
  assert.notEqual(q.quoteToken,v.quote(cart,0).quoteToken);
  assert.throws(()=>v.quote({...cart,items:[]},0));assert.throws(()=>v.quote({...cart,hasUnavailableItems:true},0));
});
