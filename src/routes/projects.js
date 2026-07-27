const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  getProjectStats,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
} = require('../controllers/projectController');
const { buildTaskQuery } = require('../controllers/taskController');

// GET /projects/new — project creation form fragment
router.get('/new', (req, res) => {
  res.render('partials/project-form', { project: null, errors: [], layout: false });
});

// POST /projects — create project
router.post('/', (req, res) => {
  const result = createProject(req.body);
  if (result.errors) {
    return res.status(422).render('partials/project-form', {
      project: null,
      errors: result.errors,
      formData: req.body,
      layout: false,
    });
  }
  // Redirect to new project page
  res.set('HX-Redirect', `/projects/${result.project.id}`);
  res.sendStatus(200);
});

// GET /projects/:id — project detail page
router.get('/:id', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).render('404', { title: 'Project Not Found' });

  const stats = getProjectStats(project.id);
  const tasks = buildTaskQuery({ project_id: project.id });
  const projects = getAllProjects();

  res.render('project', { project, stats, tasks, projects, title: project.name, currentPage: 'project', currentProject: project });
});

// GET /projects/:id/edit — edit form fragment
router.get('/:id/edit', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).send('<p class="error-msg">Project not found.</p>');
  res.render('partials/project-form', { project, errors: [], layout: false });
});

// PUT /projects/:id — update project
router.put('/:id', (req, res) => {
  const result = updateProject(req.params.id, req.body);
  if (result.errors) {
    return res.status(422).render('partials/project-form', {
      project: { id: req.params.id, ...req.body },
      errors: result.errors,
      layout: false,
    });
  }
  res.set('HX-Redirect', `/projects/${req.params.id}`);
  res.sendStatus(200);
});

// DELETE /projects/:id — archive project
router.delete('/:id', (req, res) => {
  archiveProject(req.params.id);
  res.set('HX-Redirect', '/');
  res.sendStatus(200);
});

module.exports = router;
