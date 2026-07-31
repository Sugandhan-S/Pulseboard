'use strict';
const { query } = require('../db/database');

async function getSummaryStats() {
  const n = (v) => Number(v || 0);

  const [
    totalRes,
    todoRes,
    inProgressRes,
    reviewRes,
    doneRes,
    dueTodayRes,
    overdueRes,
    activeProjectsRes,
  ] = await Promise.all([
    query('SELECT COUNT(*) as count FROM tasks'),
    query("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'"),
    query("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'"),
    query("SELECT COUNT(*) as count FROM tasks WHERE status = 'review'"),
    query("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'"),
    query('SELECT COUNT(*) as count FROM tasks WHERE is_completed = 0 AND due_date = CURRENT_DATE'),
    query('SELECT COUNT(*) as count FROM tasks WHERE is_completed = 0 AND due_date < CURRENT_DATE'),
    query("SELECT COUNT(*) as count FROM projects WHERE status = 'active'"),
  ]);

  return {
    total: n(totalRes.rows[0].count),
    todo: n(todoRes.rows[0].count),
    inProgress: n(inProgressRes.rows[0].count),
    review: n(reviewRes.rows[0].count),
    done: n(doneRes.rows[0].count),
    dueToday: n(dueTodayRes.rows[0].count),
    overdue: n(overdueRes.rows[0].count),
    activeProjects: n(activeProjectsRes.rows[0].count),
  };
}

module.exports = { getSummaryStats };
