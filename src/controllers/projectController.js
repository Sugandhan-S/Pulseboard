'use strict';
process.removeAllListeners('warning');

const { getDb } = require('../db/database');

function logActivity(db, entityType, entityId, action, message) {
  db.prepare(`
    INSERT INTO activity_logs (entity_type, entity_id, action, message)
    VALUES (?, ?, ?, ?)
  `).run(entityType, entityId, action, message);
}

function getAllProjects(includeArchived = false) {
  const db = getDb();
  const query = includeArchived
    ? `SELECT * FROM projects ORDER BY status ASC, name ASC`
    : `SELECT * FROM projects WHERE status = 'active' ORDER BY name ASC`;
  return db.prepare(query).all();
}

function getProjectById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(id));
}

function getProjectStats(id) {
  const db = getDb();
  const nid = Number(id);
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(nid).count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'done'").get(nid).count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'in_progress'").get(nid).count;
  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE project_id = ? AND is_completed = 0 AND due_date < date('now')
  `).get(nid).count;
  return { total, done, inProgress, overdue };
}

function createProject(data) {
  const db = getDb();
  const { name, description } = data;

  const errors = [];
  if (!name || !name.trim()) errors.push('Project name is required.');
  if (name && name.trim().length > 80) errors.push('Name must be 80 characters or fewer.');
  if (errors.length) return { errors };

  const result = db.prepare(`
    INSERT INTO projects (name, description) VALUES (?, ?)
  `).run(name.trim(), description ? description.trim() : null);

  const project = getProjectById(Number(result.lastInsertRowid));
  logActivity(db, 'project', project.id, 'created', `Project "${project.name}" was created`);
  return { project };
}

function updateProject(id, data) {
  const db = getDb();
  const { name, description } = data;

  const errors = [];
  if (!name || !name.trim()) errors.push('Project name is required.');
  if (name && name.trim().length > 80) errors.push('Name must be 80 characters or fewer.');
  if (errors.length) return { errors };

  db.prepare(`
    UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(name.trim(), description ? description.trim() : null, Number(id));

  const project = getProjectById(Number(id));
  logActivity(db, 'project', project.id, 'updated', `Project "${project.name}" was renamed`);
  return { project };
}

function archiveProject(id) {
  const db = getDb();
  const project = getProjectById(Number(id));
  if (!project) return false;

  db.prepare(`UPDATE projects SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(Number(id));
  logActivity(db, 'project', Number(id), 'archived', `Project "${project.name}" was archived`);
  return true;
}

function deleteProject(id) {
  const db = getDb();
  const project = getProjectById(Number(id));
  if (!project) return false;

  db.prepare('DELETE FROM projects WHERE id = ?').run(Number(id));
  logActivity(db, 'project', Number(id), 'deleted', `Project "${project.name}" was deleted`);
  return true;
}

module.exports = {
  getAllProjects,
  getProjectById,
  getProjectStats,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
};
