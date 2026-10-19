require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
const fs=require('fs');
(async()=>{try{await pool.query(fs.readFileSync(require('path').join(__dirname,'../migrations/create_customer_sessions_table.sql'),'utf8'));console.log('Customer session table ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
