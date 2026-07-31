const express = require('express');
const router = express.Router();
const { getSummaryStats } = require('../controllers/statsController');

// GET /stats/summary — dashboard KPI card fragment (OOB target)
router.get('/summary', async (req, res, next) => {
  try {
    const stats = await getSummaryStats();
    res.render('partials/stats-cards', { stats, layout: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
