
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const Customer=require('../models/Customer');
const Session=require('../models/CustomerSession');
const session=require('../utils/customerSession');
const dummy=bcrypt.hashSync(crypto.randomBytes(24).toString('hex'),12);
exports.login=async(req,res,next)=>{
  try{
    const {email,password,remember}=req.body||{};
    if(typeof email!=='string'||email.length>191||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||typeof password!=='string'||!password||Buffer.byteLength(password)>72)return res.status(422).json({message:'Enter a valid email and password.'});
    const customer=await Customer.findByEmail(email.trim().toLowerCase());
    const valid=await bcrypt.compare(password,customer?.password_hash||dummy);
    if(!customer||!valid)return res.status(401).json({message:'Invalid email or password.'});
    if(!customer.email_verified)return res.status(403).json({message:'Verify your email before signing in.',verificationRequired:true,email:customer.email});
    if(!customer.is_active)return res.status(401).json({message:'This account is inactive. Please contact the store.'});
    await session.start(req,res,customer.id,remember===true);
    res.json({customer:session.publicCustomer(customer)});
  }catch(e){next(e);}
};
exports.me=(req,res)=>res.json({customer:req.customer});
exports.logout=async(req,res,next)=>{
  try{const token=session.readToken(req);if(token)await Session.revoke(session.hash(token));res.clearCookie(session.cookieName,session.options());res.json({success:true});}catch(e){next(e);}
};
