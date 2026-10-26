const Reset=require('../models/PasswordReset');
const mailer=require('../utils/mailer');
const session=require('../utils/customerSession');
function resetUrl(token){
 const origin=(process.env.CLIENT_URL||'http://localhost:3000').split(',')[0].trim();
 const url=new URL('/reset-password',origin);
 if(!['http:','https:'].includes(url.protocol)||(process.env.NODE_ENV==='production'&&url.protocol!=='https:'))throw new Error('Invalid reset site configuration');
 url.hash='token='+token;return url.href;
}
exports.forgot=async(req,res)=>{
 const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
 if(email.length>191||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(422).json({message:'Enter a valid email address.'});
 // Respond uniformly before delivery: neither account existence nor SMTP timing is exposed.
 res.json({message:'If an active, verified account matches that email, a reset link will arrive shortly. Check your spam folder too.'});
 try{
  resetUrl('');const record=await Reset.issue(email);if(!record)return;
  await mailer.sendMail({to:record.email,subject:'Reset your Money Hold password',text:`Reset your Money Hold password using this link:\n\n${resetUrl(record.token)}\n\nThis link expires in 30 minutes and works once. If you did not request this, ignore this email. Your password has not changed.`});
 }catch(e){console.error('Password reset delivery failed:',e.code||'RESET_MAIL_ERROR');}
};
exports.reset=async(req,res,next)=>{
 try{await Reset.consume(req.body);res.clearCookie(session.cookieName,session.options());res.json({message:'Password updated. Please sign in with your new password.'});}
 catch(e){if(e.status)return res.status(e.status).json({message:e.message});next(e);}
};
