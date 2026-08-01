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
      // Supabase cold-start resilience settings
      connectionTimeoutMillis: 10000,   // wait up to 10s for a connection
      idleTimeoutMillis: 30000,          // release idle connections after 30s
      max: 5,                            // keep pool small for free-tier limits
    });
  }
  return pool;
}

/**
 * Helper to run SQL queries via pg pool.
 * Note: When using Supabase, ensure you connect to the transaction pooler (port 6543)
 * if this app creates many short-lived connections.
 * @param {string} text 
 * @param {Array} [params] 
 */
async function query(text, params) {
  const p = getPool();
  return await p.query(text, params);
}

module.exports = { getPool, query };
