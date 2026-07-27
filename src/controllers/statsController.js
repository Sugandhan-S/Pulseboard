'use strict';
process.removeAllListeners('warning');

const { getDb } = require('../db/database');

function getSummaryStats() {
  const db = getDb();

  const n = (v) => Number(v);

  const total = n(db.prepare('SELECT COUNT(*) as count FROM tasks').get().count);
  const todo = n(db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'").get().count);
  const inProgress = n(db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get().count);
  const review = n(db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'review'").get().count);
  const done = n(db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get().count);

  const dueToday = n(db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE is_completed = 0 AND due_date = date('now')
  `).get().count);

  const overdue = n(db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE is_completed = 0 AND due_date < date('now')
  `).get().count);

  const activeProjects = n(db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get().count);

  return { total, todo, inProgress, review, done, dueToday, overdue, activeProjects };
}

module.exports = { getSummaryStats };
