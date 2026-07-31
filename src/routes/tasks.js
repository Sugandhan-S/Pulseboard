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
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search || '',
      project_id: req.query.project_id || '',
      status: req.query.status || '',
      priority: req.query.priority || '',
      due_from: req.query.due_from || '',
      due_to: req.query.due_to || '',
    };
    const [tasks, projects] = await Promise.all([
      buildTaskQuery(filters),
      getAllProjects(),
    ]);
    res.render('partials/task-list', { tasks, filters, projects, layout: false });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/new — task creation form fragment (modal)
router.get('/new', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    res.render('partials/task-form', {
      task: null,
      projects,
      errors: [],
      layout: false,
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create task
router.post('/', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    const result = await createTask(req.body);

    if (result.errors) {
      return res.status(422).render('partials/task-form', {
        task: null,
        projects,
        errors: result.errors,
        formData: req.body,
        layout: false,
      });
    }

    const [stats, activity] = await Promise.all([
      getSummaryStats(),
      getRecentActivity(10),
    ]);
    res.render('partials/task-created-response', {
      task: result.task,
      stats,
      activity,
      layout: false,
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id/edit — inline edit form (replaces the task row)
router.get('/:id/edit', async (req, res, next) => {
  try {
    const [task, projects] = await Promise.all([
      getTaskById(req.params.id),
      getAllProjects(),
    ]);
    if (!task) return res.status(404).send('<p class="error-msg">Task not found.</p>');
    res.render('partials/task-edit-inline', {
      task,
      projects,
      errors: [],
      layout: false,
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id/cancel — cancel inline edit, restore task row
router.get('/:id/cancel', async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) return res.status(404).send('<p class="error-msg">Task not found.</p>');
    res.render('partials/task-row', { task, layout: false });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id — update task
router.put('/:id', async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    const result = await updateTask(req.params.id, req.body);

    if (result.errors) {
      const task = await getTaskById(req.params.id);
      return res.status(422).render('partials/task-edit-inline', {
        task: task || { id: req.params.id, ...req.body },
        projects,
        errors: result.errors,
        formData: req.body,
        layout: false,
      });
    }

    const [stats, activity] = await Promise.all([
      getSummaryStats(),
      getRecentActivity(10),
    ]);
    res.render('partials/task-updated-response', {
      task: result.task,
      stats,
      activity,
      layout: false,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id/status — quick status change
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await patchTaskStatus(req.params.id, status);

    const [stats, activity] = await Promise.all([
      getSummaryStats(),
      getRecentActivity(10),
    ]);
    res.render('partials/task-updated-response', {
      task: result.task,
      stats,
      activity,
      layout: false,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id — delete task
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTask(req.params.id);
    const [stats, activity] = await Promise.all([
      getSummaryStats(),
      getRecentActivity(10),
    ]);

    res.render('partials/task-deleted-response', { stats, activity, layout: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
