const express = require('express');
const router = express.Router();
const { getSummaryStats } = require('../controllers/statsController');

// GET /stats/summary — dashboard KPI card fragment (OOB target)
router.get('/summary', (req, res) => {
  const stats = getSummaryStats();
  res.render('partials/stats-cards', { stats, layout: false });
});

module.exports = router;
