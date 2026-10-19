const Notification=require('../models/Notification');
const events=require('../utils/catalogEvents');
const identity=req=>req.customer?['customer',req.customer.id]:['seller',req.seller.id];
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
exports.list=wrap(async(req,res)=>res.json(await Notification.list(...identity(req),req.query.page)));
exports.read=wrap(async(req,res)=>{const [role,id]=identity(req);await Notification.markRead(role,id,req.params.id);events.emit(`notifications:${role}:${id}`);res.json({success:true});});
exports.stream=(req,res)=>{
  const [role,id]=identity(req),keys=[`notifications:${role}:${id}`,role==='seller'?'orders:seller':`orders:customer:${id}`];
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const change=()=>res.write('data: notifications\n\n');change();keys.forEach(key=>events.on(key,change));
  const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),25000),expiry=setTimeout(()=>res.end(),60000);
  req.on('close',()=>{clearInterval(heartbeat);clearTimeout(expiry);keys.forEach(key=>events.off(key,change));});
};
