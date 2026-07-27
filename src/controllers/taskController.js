'use strict';
process.removeAllListeners('warning');

const { getDb } = require('../db/database');

function logActivity(db, entityType, entityId, action, message) {
  db.prepare(`
    INSERT INTO activity_logs (entity_type, entity_id, action, message)
    VALUES (?, ?, ?, ?)
  `).run(entityType, entityId, action, message);
}

function buildTaskQuery(filters) {
  const db = getDb();
  let query = `
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.search) {
    query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.project_id) {
    query += ` AND t.project_id = ?`;
    params.push(Number(filters.project_id));
  }
  if (filters.status) {
    query += ` AND t.status = ?`;
    params.push(filters.status);
  }
  if (filters.priority) {
    query += ` AND t.priority = ?`;
    params.push(filters.priority);
  }
  if (filters.due_from) {
    query += ` AND t.due_date >= ?`;
    params.push(filters.due_from);
  }
  if (filters.due_to) {
    query += ` AND t.due_date <= ?`;
    params.push(filters.due_to);
  }

  query += ` ORDER BY
    CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date ASC,
    t.created_at DESC
  `;

  return db.prepare(query).all(...params);
}

function getTaskById(id) {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(id);
}

function getTaskTags(taskId) {
  const db = getDb();
  return db.prepare('SELECT tag FROM task_tags WHERE task_id = ?').all(taskId).map(r => r.tag);
}

function createTask(data) {
  const db = getDb();
  const { title, description, project_id, status, priority, due_date } = data;

  const errors = [];
  if (!title || !title.trim()) errors.push('Title is required.');
  if (title && title.trim().length > 120) errors.push('Title must be 120 characters or fewer.');
  if (errors.length) return { errors };

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    project_id ? Number(project_id) : null,
    title.trim(),
    description ? description.trim() : null,
    status || 'todo',
    priority || 'medium',
    due_date || null
  );

  const task = getTaskById(Number(result.lastInsertRowid));
  logActivity(db, 'task', task.id, 'created', `Task "${task.title}" was created`);
  return { task };
}

function updateTask(id, data) {
  const db = getDb();
  const { title, description, project_id, status, priority, due_date } = data;

  const errors = [];
  if (!title || !title.trim()) errors.push('Title is required.');
  if (title && title.trim().length > 120) errors.push('Title must be 120 characters or fewer.');
  if (errors.length) return { errors };

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, project_id = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title.trim(),
    description ? description.trim() : null,
    project_id ? Number(project_id) : null,
    status || 'todo',
    priority || 'medium',
    due_date || null,
    Number(id)
  );

  const task = getTaskById(Number(id));
  logActivity(db, 'task', task.id, 'updated', `Task "${task.title}" was updated`);
  return { task };
}

function patchTaskStatus(id, status) {
  const db = getDb();
  const isCompleted = status === 'done' ? 1 : 0;

  db.prepare(`
    UPDATE tasks SET status = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, isCompleted, Number(id));

  const task = getTaskById(Number(id));
  const label = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }[status] || status;
  logActivity(db, 'task', task.id, 'status_changed', `Task "${task.title}" moved to ${label}`);
  return { task };
}

function deleteTask(id) {
  const db = getDb();
  const task = getTaskById(Number(id));
  if (!task) return false;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
  logActivity(db, 'task', Number(id), 'deleted', `Task "${task.title}" was deleted`);
  return true;
}

module.exports = {
  buildTaskQuery,
  getTaskById,
  getTaskTags,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
};
