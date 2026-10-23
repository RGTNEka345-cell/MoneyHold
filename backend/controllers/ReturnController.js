const ReturnRequest=require('../models/ReturnRequest');
const events=require('../utils/catalogEvents');
const wrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}};
function notify(customerId){events.emit('orders:customer:'+customerId);events.emit('orders:seller');}
exports.create=wrap(async(req,res)=>{const result=await ReturnRequest.create(req.params.id,req.customer.id,req.body||{});if(!result.replayed)notify(result.customerId);res.status(result.replayed?200:201).json({id:result.id});});
exports.change=wrap(async(req,res)=>{const result=await ReturnRequest.change(req.params.id,req.params.returnId,req.seller.id,req.body||{});notify(result.customerId);if(result.stockChanged)events.emit('change');res.json({success:true});});
