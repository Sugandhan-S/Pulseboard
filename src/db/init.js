'use strict';
// Suppress the experimental warning for node:sqlite
process.removeAllListeners('warning');

const fs = require('fs');
const path = require('path');
const { getDb } = require('./database');

function initDb() {
  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split on semicolons and run each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const stmt of statements) {
      db.exec(stmt + ';');
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  console.log('✅ Database initialized successfully.');
}

initDb();
