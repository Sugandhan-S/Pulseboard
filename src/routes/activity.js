const express = require('express');
const router = express.Router();
const { getRecentActivity, getAllActivity } = require('../controllers/activityController');
const { getAllProjects } = require('../controllers/projectController');

// GET /activity — full activity feed page
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const [activityResult, projects] = await Promise.all([
      getAllActivity(page, 30),
      getAllProjects(),
    ]);
    const { items, total, totalPages } = activityResult;
    res.render('activity', { items, total, totalPages, page, projects, title: 'Activity Feed', currentPage: 'activity', currentProject: null });
  } catch (err) {
    next(err);
  }
});

// GET /activity/recent — recent activity fragment for HTMX refresh
router.get('/recent', async (req, res, next) => {
  try {
    const activity = await getRecentActivity(10);
    res.render('partials/activity-feed', { activity, layout: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
