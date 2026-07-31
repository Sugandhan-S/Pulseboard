'use strict';
const { query } = require('../db/database');

async function logActivity(entityType, entityId, action, message) {
  await query(
    `INSERT INTO activity_logs (entity_type, entity_id, action, message)
     VALUES ($1, $2, $3, $4)`,
    [entityType, entityId, action, message]
  );
}

async function buildTaskQuery(filters = {}) {
  let sql = `
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  let paramIdx = 1;

  if (filters.search) {
    sql += ` AND (t.title ILIKE $${paramIdx} OR t.description ILIKE $${paramIdx + 1})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
    paramIdx += 2;
  }
  if (filters.project_id) {
    sql += ` AND t.project_id = $${paramIdx}`;
    params.push(Number(filters.project_id));
    paramIdx += 1;
  }
  if (filters.status) {
    sql += ` AND t.status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx += 1;
  }
  if (filters.priority) {
    sql += ` AND t.priority = $${paramIdx}`;
    params.push(filters.priority);
    paramIdx += 1;
  }
  if (filters.due_from) {
    sql += ` AND t.due_date >= $${paramIdx}`;
    params.push(filters.due_from);
    paramIdx += 1;
  }
  if (filters.due_to) {
    sql += ` AND t.due_date <= $${paramIdx}`;
    params.push(filters.due_to);
    paramIdx += 1;
  }

  sql += ` ORDER BY
    CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
    t.due_date ASC,
    t.created_at DESC
  `;

  const res = await query(sql, params);
  return res.rows;
}

async function getTaskById(id) {
  const res = await query(`
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = $1
  `, [Number(id)]);
  return res.rows[0] || null;
}

async function getTaskTags(taskId) {
  const res = await query('SELECT tag FROM task_tags WHERE task_id = $1', [Number(taskId)]);
  return res.rows.map(r => r.tag);
}

async function createTask(data) {
  const { title, description, project_id, status, priority, due_date } = data;

  const errors = [];
  if (!title || !title.trim()) errors.push('Title is required.');
  if (title && title.trim().length > 120) errors.push('Title must be 120 characters or fewer.');
  if (errors.length) return { errors };

  const insertRes = await query(`
    INSERT INTO tasks (project_id, title, description, status, priority, due_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [
    project_id ? Number(project_id) : null,
    title.trim(),
    description ? description.trim() : null,
    status || 'todo',
    priority || 'medium',
    due_date || null
  ]);

  const newId = insertRes.rows[0].id;
  const task = await getTaskById(newId);
  await logActivity('task', task.id, 'created', `Task "${task.title}" was created`);
  return { task };
}

async function updateTask(id, data) {
  const { title, description, project_id, status, priority, due_date } = data;

  const errors = [];
  if (!title || !title.trim()) errors.push('Title is required.');
  if (title && title.trim().length > 120) errors.push('Title must be 120 characters or fewer.');
  if (errors.length) return { errors };

  await query(`
    UPDATE tasks
    SET title = $1, description = $2, project_id = $3, status = $4, priority = $5, due_date = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
  `, [
    title.trim(),
    description ? description.trim() : null,
    project_id ? Number(project_id) : null,
    status || 'todo',
    priority || 'medium',
    due_date || null,
    Number(id)
  ]);

  const task = await getTaskById(Number(id));
  if (task) {
    await logActivity('task', task.id, 'updated', `Task "${task.title}" was updated`);
  }
  return { task };
}

async function patchTaskStatus(id, status) {
  const isCompleted = status === 'done' ? 1 : 0;

  await query(`
    UPDATE tasks SET status = $1, is_completed = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3
  `, [status, isCompleted, Number(id)]);

  const task = await getTaskById(Number(id));
  const label = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }[status] || status;
  if (task) {
    await logActivity('task', task.id, 'status_changed', `Task "${task.title}" moved to ${label}`);
  }
  return { task };
}

async function deleteTask(id) {
  const task = await getTaskById(Number(id));
  if (!task) return false;

  await query('DELETE FROM tasks WHERE id = $1', [Number(id)]);
  await logActivity('task', Number(id), 'deleted', `Task "${task.title}" was deleted`);
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
