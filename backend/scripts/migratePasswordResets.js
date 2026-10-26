require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
(async()=>{try{await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../migrations/create_password_resets_table.sql'),'utf8'));console.log('Password reset table ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Migration failed');process.exitCode=1;});
