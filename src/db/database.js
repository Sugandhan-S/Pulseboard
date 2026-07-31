'use strict';
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('⚠️ DATABASE_URL environment variable is not set!');
    }

    const isProduction = process.env.NODE_ENV === 'production' || (connectionString && connectionString.includes('supabase'));

    pool = new Pool({
      connectionString: connectionString || 'postgres://postgres:postgres@localhost:5432/pulseboard',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/**
 * Helper to run SQL queries via pg pool.
 * @param {string} text 
 * @param {Array} [params] 
 */
async function query(text, params) {
  const p = getPool();
  return await p.query(text, params);
}

module.exports = { getPool, query };
