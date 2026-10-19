module.exports=(req,res,next)=>{
  res.set('Cache-Control','no-store');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
    const allowed=(process.env.CLIENT_URL||'http://localhost:3000').split(',').map(x=>x.trim());
    if(!allowed.includes(req.get('Origin')))return res.status(403).json({message:'Request origin is not allowed.'});
  }
  next();
};
