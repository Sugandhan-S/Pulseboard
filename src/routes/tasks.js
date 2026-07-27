const express = require('express');
const router = express.Router();
const {
  buildTaskQuery,
  getTaskById,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { getAllProjects } = require('../controllers/projectController');
const { getSummaryStats } = require('../controllers/statsController');
const { getRecentActivity } = require('../controllers/activityController');

// GET /tasks — filtered task list fragment
router.get('/', (req, res) => {
  const filters = {
    search: req.query.search || '',
    project_id: req.query.project_id || '',
    status: req.query.status || '',
    priority: req.query.priority || '',
    due_from: req.query.due_from || '',
    due_to: req.query.due_to || '',
  };
  const tasks = buildTaskQuery(filters);
  const projects = getAllProjects();
  res.render('partials/task-list', { tasks, filters, projects, layout: false });
});

// GET /tasks/new — task creation form fragment (modal)
router.get('/new', (req, res) => {
  const projects = getAllProjects();
  res.render('partials/task-form', {
    task: null,
    projects,
    errors: [],
    layout: false,
  });
});

// POST /tasks — create task
router.post('/', (req, res) => {
  const projects = getAllProjects();
  const result = createTask(req.body);

  if (result.errors) {
    res.status(422).render('partials/task-form', {
      task: null,
      projects,
      errors: result.errors,
      formData: req.body,
      layout: false,
    });
    return;
  }

  // Return the new task row + OOB stats and activity refresh
  const stats = getSummaryStats();
  const activity = getRecentActivity(10);
  res.render('partials/task-created-response', {
    task: result.task,
    stats,
    activity,
    layout: false,
  });
});

// GET /tasks/:id/edit — inline edit form (replaces the task row)
router.get('/:id/edit', (req, res) => {
  const task = getTaskById(req.params.id);
  if (!task) return res.status(404).send('<p class="error-msg">Task not found.</p>');
  const projects = getAllProjects();
  res.render('partials/task-edit-inline', {
    task,
    projects,
    errors: [],
    layout: false,
  });
});

// GET /tasks/:id/cancel — cancel inline edit, restore task row
router.get('/:id/cancel', (req, res) => {
  const task = getTaskById(req.params.id);
  if (!task) return res.status(404).send('<p class="error-msg">Task not found.</p>');
  res.render('partials/task-row', { task, layout: false });
});

// PUT /tasks/:id — update task
router.put('/:id', (req, res) => {
  const projects = getAllProjects();
  const result = updateTask(req.params.id, req.body);

  if (result.errors) {
    const task = getTaskById(req.params.id);
    res.status(422).render('partials/task-edit-inline', {
      task: task || { id: req.params.id, ...req.body },
      projects,
      errors: result.errors,
      formData: req.body,
      layout: false,
    });
    return;
  }

  const stats = getSummaryStats();
  const activity = getRecentActivity(10);
  res.render('partials/task-updated-response', {
    task: result.task,
    stats,
    activity,
    layout: false,
  });
});

// PATCH /tasks/:id/status — quick status change
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const result = patchTaskStatus(req.params.id, status);

  const stats = getSummaryStats();
  const activity = getRecentActivity(10);
  res.render('partials/task-updated-response', {
    task: result.task,
    stats,
    activity,
    layout: false,
  });
});

// DELETE /tasks/:id — delete task
router.delete('/:id', (req, res) => {
  deleteTask(req.params.id);
  const stats = getSummaryStats();
  const activity = getRecentActivity(10);

  // Return empty string for the task row (it gets removed) + OOB updates
  res.render('partials/task-deleted-response', { stats, activity, layout: false });
});

module.exports = router;
