
const Cart=require('../models/Cart');
const events=require('../utils/catalogEvents');
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
exports.get=wrap(async(req,res)=>res.json(await Cart.read(req.customer.id)));
exports.change=action=>wrap(async(req,res)=>{
  await Cart.change(req.customer.id,action,action==='add'?req.body?.variantId:req.params.id,req.body?.quantity);
  events.emit('cart:'+req.customer.id);
  res.json(await Cart.read(req.customer.id));
});
exports.events=(req,res)=>{
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const change=()=>res.write('data: cart\n\n');change();
  const key='cart:'+req.customer.id;
  events.on(key,change);events.on('change',change);
  const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),25000);
  const expiry=setTimeout(()=>res.end(),60000);
  req.on('close',()=>{clearInterval(heartbeat);clearTimeout(expiry);events.off(key,change);events.off('change',change);});
};
