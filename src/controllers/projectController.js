'use strict';
const { query } = require('../db/database');

async function logActivity(entityType, entityId, action, message) {
  await query(
    `INSERT INTO activity_logs (entity_type, entity_id, action, message)
     VALUES ($1, $2, $3, $4)`,
    [entityType, entityId, action, message]
  );
}

async function getAllProjects(includeArchived = false) {
  const sql = includeArchived
    ? `SELECT * FROM projects ORDER BY status ASC, name ASC`
    : `SELECT * FROM projects WHERE status = 'active' ORDER BY name ASC`;
  const res = await query(sql);
  return res.rows;
}

async function getProjectById(id) {
  const res = await query('SELECT * FROM projects WHERE id = $1', [Number(id)]);
  return res.rows[0] || null;
}

async function getProjectStats(id) {
  const nid = Number(id);
  const [totalRes, doneRes, inProgressRes, overdueRes] = await Promise.all([
    query('SELECT COUNT(*) as count FROM tasks WHERE project_id = $1', [nid]),
    query("SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND status = 'done'", [nid]),
    query("SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND status = 'in_progress'", [nid]),
    query(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND is_completed = 0 AND due_date < CURRENT_DATE',
      [nid]
    ),
  ]);

  return {
    total: Number(totalRes.rows[0].count),
    done: Number(doneRes.rows[0].count),
    inProgress: Number(inProgressRes.rows[0].count),
    overdue: Number(overdueRes.rows[0].count),
  };
}

async function createProject(data) {
  const { name, description } = data;

  const errors = [];
  if (!name || !name.trim()) errors.push('Project name is required.');
  if (name && name.trim().length > 80) errors.push('Name must be 80 characters or fewer.');
  if (errors.length) return { errors };

  const res = await query(
    `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *`,
    [name.trim(), description ? description.trim() : null]
  );

  const project = res.rows[0];
  await logActivity('project', project.id, 'created', `Project "${project.name}" was created`);
  return { project };
}

async function updateProject(id, data) {
  const { name, description } = data;

  const errors = [];
  if (!name || !name.trim()) errors.push('Project name is required.');
  if (name && name.trim().length > 80) errors.push('Name must be 80 characters or fewer.');
  if (errors.length) return { errors };

  const res = await query(
    `UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
    [name.trim(), description ? description.trim() : null, Number(id)]
  );

  const project = res.rows[0];
  if (project) {
    await logActivity('project', project.id, 'updated', `Project "${project.name}" was renamed`);
  }
  return { project };
}

async function archiveProject(id) {
  const project = await getProjectById(id);
  if (!project) return false;

  await query(`UPDATE projects SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [Number(id)]);
  await logActivity('project', Number(id), 'archived', `Project "${project.name}" was archived`);
  return true;
}

async function deleteProject(id) {
  const project = await getProjectById(id);
  if (!project) return false;

  await query('DELETE FROM projects WHERE id = $1', [Number(id)]);
  await logActivity('project', Number(id), 'deleted', `Project "${project.name}" was deleted`);
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
