'use strict';
process.removeAllListeners('warning');

const { getDb } = require('../db/database');

function getRecentActivity(limit = 15) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?
  `).all(limit);
}

function getAllActivity(page = 1, perPage = 30) {
  const db = getDb();
  const offset = (page - 1) * perPage;
  const items = db.prepare(`
    SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(perPage, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get().count;
  return { items, total, page, perPage, totalPages: Math.ceil(Number(total) / perPage) };
}

module.exports = { getRecentActivity, getAllActivity };
