require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
const fs=require('fs'),path=require('path');
(async()=>{try{for(const table of ['return_requests','return_history'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));console.log('Returns and exchanges tables ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Returns migration failed');process.exitCode=1;});
