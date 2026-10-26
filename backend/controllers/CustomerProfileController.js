const Profile=require('../models/CustomerProfile');
const Address=require('../models/CustomerAddress');
const events=require('../utils/catalogEvents');
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
exports.profile=wrap(async(req,res)=>res.json(await Profile.read(req.customer.id)));
exports.update=wrap(async(req,res)=>{const result=await Profile.update(req.customer.id,req.body);events.emit('account:'+req.customer.id);res.json(result);});
exports.addresses=wrap(async(req,res)=>res.json({addresses:await Address.list(req.customer.id)}));
exports.addressChange=action=>wrap(async(req,res)=>{const result=await Address.change(req.customer.id,action,req.params.id,req.body);events.emit('account:'+req.customer.id);res.status(action==='create'?201:200).json(result);});
exports.stream=(req,res)=>{
  const key='account:'+req.customer.id;
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const change=()=>res.write('data: account\n\n');change();events.on(key,change);
  const timer=setInterval(()=>res.write(': heartbeat\n\n'),25000),expiry=setTimeout(()=>res.end(),60000);
  req.on('close',()=>{clearInterval(timer);clearTimeout(expiry);events.off(key,change);});
};
