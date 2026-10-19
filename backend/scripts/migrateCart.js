require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
const fs=require('fs'),path=require('path');
(async()=>{try{for(const table of ['carts','cart_items'])await pool.query(fs.readFileSync(path.join(__dirname,`../migrations/create_${table}_table.sql`),'utf8'));console.log('Cart tables ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.message||e.code||'Cart migration failed.');process.exitCode=1;});
