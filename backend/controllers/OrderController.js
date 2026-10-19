
const Order=require('../models/Order');
const events=require('../utils/catalogEvents');
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
const notify=customerId=>{events.emit('orders:customer:'+customerId);events.emit('orders:seller');};
exports.quote=wrap(async(req,res)=>res.json(await Order.quote(req.customer.id)));
exports.tracking=wrap(async(req,res)=>{
  const result=await require('../models/OrderTracking').save(req.params.id,req.seller.id,req.body);
  if(result.changed)notify(result.customerId);
  res.json({order:await Order.detail(req.params.id)});
});
exports.place=wrap(async(req,res)=>{
  const result=await Order.place(req.customer.id,req.body);
  if(!result.replayed){events.emit('cart:'+req.customer.id);events.emit('change');notify(req.customer.id);}
  res.status(result.replayed?200:201).json(result);
});
exports.list=wrap(async(req,res)=>res.json(await Order.list(req.customer.id,req.query.page)));
exports.detail=wrap(async(req,res)=>res.json({order:await Order.detail(req.params.id,req.customer.id)}));
exports.findRequest=wrap(async(req,res)=>res.json(await Order.findRequest(req.customer.id,req.params.key)));
exports.sellerList=wrap(async(req,res)=>res.json(await Order.list(null,req.query.page)));
exports.sellerDetail=wrap(async(req,res)=>res.json({order:await Order.detail(req.params.id)}));
exports.status=wrap(async(req,res)=>{
  const customerId=await Order.changeStatus(req.params.id,req.seller.id,req.body?.status,req.body?.expectedStatus);
  notify(customerId);if(req.body.status==='cancelled')events.emit('change');
  res.json({order:await Order.detail(req.params.id)});
});
exports.stream=(req,res)=>{
  const key=req.customer?'orders:customer:'+req.customer.id:'orders:seller';
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const changed=()=>res.write('data: orders\n\n');changed();events.on(key,changed);
  const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),25000),expiry=setTimeout(()=>res.end(),60000);
  req.on('close',()=>{clearInterval(heartbeat);clearTimeout(expiry);events.off(key,changed);});
};
