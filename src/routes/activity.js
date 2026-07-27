const express = require('express');
const router = express.Router();
const { getRecentActivity, getAllActivity } = require('../controllers/activityController');
const { getAllProjects } = require('../controllers/projectController');

// GET /activity — full activity feed page
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const { items, total, totalPages } = getAllActivity(page, 30);
  const projects = getAllProjects();
  res.render('activity', { items, total, totalPages, page, projects, title: 'Activity Feed', currentPage: 'activity', currentProject: null });
});

// GET /activity/recent — recent activity fragment for HTMX refresh
router.get('/recent', (req, res) => {
  const activity = getRecentActivity(10);
  res.render('partials/activity-feed', { activity, layout: false });
});

module.exports = router;
