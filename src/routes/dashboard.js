const express = require('express');
const router = express.Router();
const { getSummaryStats } = require('../controllers/statsController');
const { getRecentActivity } = require('../controllers/activityController');
const { buildTaskQuery } = require('../controllers/taskController');
const { getAllProjects } = require('../controllers/projectController');

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

    const [stats, activity, projects, tasks] = await Promise.all([
      getSummaryStats(),
      getRecentActivity(10),
      getAllProjects(),
      buildTaskQuery(filters),
    ]);

    res.render('dashboard', { stats, activity, projects, tasks, filters, title: 'Dashboard', currentPage: 'dashboard', currentProject: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
