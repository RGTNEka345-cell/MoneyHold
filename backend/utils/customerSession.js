const crypto=require('crypto');
const Session=require('../models/CustomerSession');
const cookieName='money_hold_customer';
const options=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api'});
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');
function readToken(req){const part=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));const token=part?part.slice(cookieName.length+1):'';return /^[a-f0-9]{64}$/.test(token)?token:'';}
const publicCustomer=c=>({id:c.id,firstName:c.first_name,lastName:c.last_name,email:c.email,phone:c.phone,role:'customer'});
async function start(req,res,id,remember=false){
  const old=readToken(req);if(old)await Session.revoke(hash(old));
  const token=crypto.randomBytes(32).toString('hex');
  const duration=remember?7*86400000:8*3600000;
  await Session.create(id,hash(token),new Date(Date.now()+duration));
  res.cookie(cookieName,token,{...options(),...(remember?{maxAge:duration}:{})});
}
module.exports={cookieName,options,hash,readToken,publicCustomer,start};
