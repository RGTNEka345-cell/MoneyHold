require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
(async()=>{try{await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../migrations/create_customer_addresses_table.sql'),'utf8'));console.log('Customer address table ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Address migration failed');process.exitCode=1;});
