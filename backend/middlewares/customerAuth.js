
const Session=require('../models/CustomerSession');
const {readToken,hash,publicCustomer}=require('../utils/customerSession');
module.exports=async(req,res,next)=>{
  try{const token=readToken(req);const customer=token&&await Session.find(hash(token));
    if(!customer)return res.status(401).json({message:'Please sign in to your customer account.'});
    req.customer=publicCustomer(customer);next();
  }catch(e){next(e);}
};
