const express = require('express');
const router = express.Router();
const { getSummaryStats } = require('../controllers/statsController');
const { getRecentActivity } = require('../controllers/activityController');
const { buildTaskQuery } = require('../controllers/taskController');
const { getAllProjects } = require('../controllers/projectController');

router.get('/', (req, res) => {
  const stats = getSummaryStats();
  const activity = getRecentActivity(10);
  const projects = getAllProjects();
  const filters = {
    search: req.query.search || '',
    project_id: req.query.project_id || '',
    status: req.query.status || '',
    priority: req.query.priority || '',
    due_from: req.query.due_from || '',
    due_to: req.query.due_to || '',
  };
  const tasks = buildTaskQuery(filters);

  res.render('dashboard', { stats, activity, projects, tasks, filters, title: 'Dashboard', currentPage: 'dashboard', currentProject: null });
});

module.exports = router;
