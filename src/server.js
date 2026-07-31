require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const ejsLayouts = require('express-ejs-layouts');
const initDb = require('./db/init');

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
app.use(async (req, res, next) => {
  try {
    const { getAllProjects } = require('./controllers/projectController');
    const projects = await getAllProjects();
    res.status(404).render('404', { title: 'Page Not Found', projects });
  } catch (err) {
    next(err);
  }
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<p style="color:red;padding:2rem;">Internal Server Error</p>');
});

// Initialize database schema and start server
async function startServer() {
  try {
    if (process.env.DATABASE_URL) {
      await initDb();
    } else {
      console.warn('⚠️ DATABASE_URL not set. Skipping auto DB initialization.');
    }
  } catch (err) {
    console.error('⚠️ DB Auto-init warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 PulseBoard running at http://localhost:${PORT}`);
  });
}

startServer();
