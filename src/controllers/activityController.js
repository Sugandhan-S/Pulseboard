'use strict';
const { query } = require('../db/database');

async function getRecentActivity(limit = 15) {
  const res = await query(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return res.rows;
}

async function getAllActivity(page = 1, perPage = 30) {
  const offset = (page - 1) * perPage;
  const itemsRes = await query(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [perPage, offset]
  );
  const totalRes = await query('SELECT COUNT(*) as count FROM activity_logs');
  const total = Number(totalRes.rows[0].count);
  return {
    items: itemsRes.rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

module.exports = { getRecentActivity, getAllActivity };
