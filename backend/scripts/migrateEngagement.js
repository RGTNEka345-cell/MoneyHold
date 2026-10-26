require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const {pool}=require('../config/database');
(async()=>{try{const sql=require('fs').readFileSync(require('path').join(__dirname,'../migrations/create_product_engagement_tables.sql'),'utf8');for(const statement of sql.split(';').filter(s=>s.trim()))await pool.query(statement);console.log('Reviews and wishlist tables ready.');}finally{await pool.end();}})().catch(e=>{console.error(e.code||'Migration failed');process.exitCode=1;});
