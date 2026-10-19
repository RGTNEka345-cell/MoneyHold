require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
(async()=>{try{
  const id=process.argv[2];if(!/^\d+$/.test(id||''))throw new Error('Usage: npm run retry:order-email -- JOB_ID');
  const [result]=await pool.execute("UPDATE order_email_jobs SET status='pending',attempts=0,available_at=NOW(),last_error=NULL WHERE id=? AND status IN ('failed','simulated')",[id]);
  console.log(result.affectedRows?'Email queued for retry.':'No failed/simulated job matched. Sent emails were not changed.');
}finally{await pool.end();}})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
