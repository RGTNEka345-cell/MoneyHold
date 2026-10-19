require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
const fs=require('fs'),path=require('path');
(async()=>{try{
  for(const table of ['orders','order_items','order_status_history'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));
  console.log('Order tables ready.');
}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Order migration failed.');process.exitCode=1;});
