require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
(async()=>{try{await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../migrations/create_order_tracking_table.sql'),'utf8'));console.log('Order tracking table ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Tracking migration failed');process.exitCode=1;});
