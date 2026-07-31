'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query, getPool } = require('./database');

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await query(schema);
    console.log('✅ PostgreSQL database schema initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    throw err;
  } finally {
    if (require.main === module) {
      await getPool().end();
    }
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
