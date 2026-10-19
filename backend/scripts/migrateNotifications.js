require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
const fs=require('fs'),path=require('path');
(async()=>{try{for(const table of ['notifications','order_email_jobs'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));console.log('Notification and email queue tables ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Migration failed');process.exitCode=1;});
