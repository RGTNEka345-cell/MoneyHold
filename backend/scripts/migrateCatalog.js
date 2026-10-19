require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
(async () => {
  try {
    for (const file of ['categories', 'products', 'product_variants', 'product_images']) {
      const sql = fs.readFileSync(path.join(__dirname, `../migrations/create_${file}_table.sql`), 'utf8');
      await pool.query(sql);
    }
    console.log('Catalog tables ready. Existing data preserved.');
  } finally { await pool.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
