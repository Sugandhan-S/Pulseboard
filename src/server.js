require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const ejsLayouts = require('express-ejs-layouts');

// Initialize database on startup
require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// ── Middleware ───────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Routes ───────────────────────────────────────────────────────
app.use('/', require('./routes/dashboard'));
app.use('/tasks', require('./routes/tasks'));
app.use('/projects', require('./routes/projects'));
app.use('/activity', require('./routes/activity'));
app.use('/stats', require('./routes/stats'));

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  const { getAllProjects } = require('./controllers/projectController');
  const projects = getAllProjects();
  res.status(404).render('404', { title: 'Page Not Found', projects });
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<p style="color:red;padding:2rem;">Internal Server Error</p>');
});

app.listen(PORT, () => {
  console.log(`🚀 PulseBoard running at http://localhost:${PORT}`);
});
