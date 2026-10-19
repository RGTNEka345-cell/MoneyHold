const crypto=require('crypto');
const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function text(value,label,max,required=true){
  if(typeof value!=='string') {if(!required&&value==null)return '';fail(`${label} is required.`);}
  const result=value.trim();
  if((required&&!result)||result.length>max||/[\x00-\x1f\x7f]/.test(result))fail(`Enter a valid ${label.toLowerCase()} (maximum ${max} characters).`);
  return result;
}
function delivery(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Enter your delivery details.');
  const result={name:text(input.name,'Recipient name',120),phone:text(input.phone,'Phone number',30),addressLine1:text(input.addressLine1,'Address',200),addressLine2:text(input.addressLine2,'Address line 2',200,false),city:text(input.city,'City',100),postalCode:text(input.postalCode,'Postal code',20,false),country:'LK'};
  const digits=result.phone.replace(/[\s()+-]/g,'');
  if(!/^\d{9,15}$/.test(digits))fail('Enter a valid contact phone number.');
  if(input.country&&input.country!=='LK')fail('Delivery is currently available within Sri Lanka only.');
  return result;
}
function deliveryFee(){
  const value=process.env.CHECKOUT_DELIVERY_FEE_LKR;
  if(typeof value!=='string'||!/^\d{1,6}(\.\d{1,2})?$/.test(value.trim()))fail('Checkout is not available yet. The store must configure its delivery fee.',503);
  return Math.round(Number(value)*100);
}
function request(input={}){
  if(!input||typeof input!=='object')fail('Invalid checkout request.');
  if(typeof input.requestKey!=='string'||!/^[a-zA-Z0-9_-]{16,64}$/.test(input.requestKey))fail('Invalid checkout request key.');
  if(typeof input.quoteToken!=='string'||!/^[a-f0-9]{64}$/.test(input.quoteToken))fail('Review your order summary before placing the order.');
  if(input.paymentMethod!=='cod')fail('Only Cash on Delivery is available.');
  return {requestKey:input.requestKey,quoteToken:input.quoteToken,paymentMethod:'cod',delivery:delivery(input.delivery)};
}
function quote(cart,fee){
  if(!cart.items.length)fail('Your bag is empty. Add an item before checkout.',409);
  if(cart.hasUnavailableItems)fail('Some items are unavailable or exceed current stock. Please update your bag.',409);
  const items=cart.items.map(i=>({variantId:Number(i.variant_id),quantity:i.quantity,unitPriceCents:i.priceCents})).sort((a,b)=>a.variantId-b.variantId);
  return {items:cart.items,subtotalCents:cart.subtotalCents,deliveryCents:fee,totalCents:cart.subtotalCents+fee,paymentMethod:'cod',country:'LK',quoteToken:digest({items,fee})};
}
const transitions={placed:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
module.exports={fail,digest,delivery,deliveryFee,request,quote,transitions};
