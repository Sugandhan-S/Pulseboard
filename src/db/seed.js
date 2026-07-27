'use strict';
process.removeAllListeners('warning');

require('./init');
const { getDb } = require('./database');

const db = getDb();

function seed() {
  db.exec('BEGIN TRANSACTION;');
  try {
    // Clear existing data
    db.exec('DELETE FROM activity_logs;');
    db.exec('DELETE FROM task_tags;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM projects;');
    // Reset auto-increment counters
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('projects','tasks','activity_logs','task_tags');");

    // ── Projects ──────────────────────────────────────────────────
    const insertProject = db.prepare(`
      INSERT INTO projects (name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const pData = [
      ['Website Redesign', 'Overhaul the public-facing marketing site with a new visual identity and improved performance.', 'active', '2026-07-01 09:00:00', '2026-07-10 14:30:00'],
      ['Mobile App v2', 'Second major release of the iOS/Android app with offline support and redesigned UX.', 'active', '2026-07-05 10:00:00', '2026-07-20 11:00:00'],
      ['API Gateway Migration', 'Move all microservices behind a unified API gateway for better auth, rate limiting, and logging.', 'active', '2026-06-15 08:00:00', '2026-07-22 16:00:00'],
      ['Legacy CRM Cleanup', 'Archive and document the old CRM system before decommissioning.', 'archived', '2026-05-01 09:00:00', '2026-06-30 17:00:00'],
    ];

    const projectIds = [];
    for (const p of pData) {
      const r = insertProject.run(...p);
      projectIds.push(Number(r.lastInsertRowid));
    }

    const [websiteId, mobileId, apiId] = projectIds;

    // ── Tasks ──────────────────────────────────────────────────────
    const insertTask = db.prepare(`
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, is_completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const daysFrom = (n) => fmt(new Date(today.getTime() + n * 86400000));

    const tasks = [
      // Website Redesign
      [websiteId, 'Audit current site performance', 'Run Lighthouse and PageSpeed reports. Document all failing metrics.', 'done', 'high', daysFrom(-10), 1, '2026-07-02 10:00:00', '2026-07-15 09:00:00'],
      [websiteId, 'Design new homepage wireframes', 'Create high-fidelity wireframes in Figma for desktop and mobile breakpoints.', 'done', 'high', daysFrom(-5), 1, '2026-07-05 11:00:00', '2026-07-20 14:00:00'],
      [websiteId, 'Implement responsive navbar', 'Build the navigation component with mobile hamburger menu and smooth transitions.', 'in_progress', 'high', daysFrom(2), 0, '2026-07-15 09:00:00', '2026-07-25 10:00:00'],
      [websiteId, 'Optimize image assets', 'Convert all images to WebP format and implement lazy loading.', 'todo', 'medium', daysFrom(5), 0, '2026-07-18 14:00:00', '2026-07-18 14:00:00'],
      [websiteId, 'Write SEO meta tags', 'Add proper title, description, og:image, and canonical tags to all pages.', 'todo', 'low', daysFrom(7), 0, '2026-07-20 11:00:00', '2026-07-20 11:00:00'],
      // Mobile App
      [mobileId, 'Design offline sync architecture', 'Define the conflict resolution strategy for offline-first data syncing.', 'review', 'high', daysFrom(1), 0, '2026-07-10 09:00:00', '2026-07-24 16:00:00'],
      [mobileId, 'Rebuild dashboard screen', 'Redesign the main dashboard using the new design system components.', 'in_progress', 'high', daysFrom(3), 0, '2026-07-12 10:00:00', '2026-07-25 09:00:00'],
      [mobileId, 'Implement push notifications', 'Integrate FCM for Android and APNs for iOS with a unified notification center.', 'todo', 'medium', daysFrom(10), 0, '2026-07-18 14:00:00', '2026-07-18 14:00:00'],
      [mobileId, 'Write unit tests for sync engine', 'Achieve 80% coverage on the offline sync module.', 'todo', 'medium', daysFrom(14), 0, '2026-07-20 15:00:00', '2026-07-20 15:00:00'],
      // API Gateway
      [apiId, 'Evaluate gateway options (Kong vs Traefik)', 'Compare features, pricing, and community support. Write ADR.', 'done', 'high', daysFrom(-14), 1, '2026-06-16 09:00:00', '2026-06-28 17:00:00'],
      [apiId, 'Set up staging gateway environment', 'Deploy Kong on staging Kubernetes cluster with basic routing rules.', 'in_progress', 'high', daysFrom(0), 0, '2026-07-01 10:00:00', '2026-07-24 11:00:00'],
      [apiId, 'Migrate auth service behind gateway', 'Route /auth endpoints through the gateway and configure JWT plugin.', 'todo', 'high', daysFrom(4), 0, '2026-07-10 09:00:00', '2026-07-10 09:00:00'],
      [apiId, 'Add rate limiting rules', 'Configure per-consumer and global rate limits across all services.', 'todo', 'medium', daysFrom(8), 0, '2026-07-15 14:00:00', '2026-07-15 14:00:00'],
      // Unassigned
      [null, 'Research competitor analysis', 'Survey 5 competitor tools and document feature gaps.', 'todo', 'low', daysFrom(21), 0, '2026-07-22 10:00:00', '2026-07-22 10:00:00'],
    ];

    const taskIds = [];
    for (const t of tasks) {
      const r = insertTask.run(...t);
      taskIds.push(Number(r.lastInsertRowid));
    }

    // ── Tags ──────────────────────────────────────────────────────
    const insertTag = db.prepare('INSERT INTO task_tags (task_id, tag) VALUES (?, ?)');
    const tagData = [
      [taskIds[0], 'performance'], [taskIds[0], 'audit'],
      [taskIds[1], 'design'], [taskIds[1], 'figma'],
      [taskIds[2], 'frontend'], [taskIds[2], 'css'],
      [taskIds[3], 'performance'], [taskIds[3], 'images'],
      [taskIds[4], 'seo'],
      [taskIds[5], 'architecture'], [taskIds[5], 'backend'],
      [taskIds[6], 'frontend'], [taskIds[6], 'design'],
      [taskIds[7], 'mobile'], [taskIds[7], 'notifications'],
      [taskIds[8], 'testing'],
      [taskIds[9], 'devops'], [taskIds[9], 'research'],
      [taskIds[10], 'devops'], [taskIds[10], 'kubernetes'],
      [taskIds[11], 'backend'], [taskIds[11], 'auth'],
      [taskIds[12], 'backend'], [taskIds[12], 'security'],
    ];
    for (const [tid, tag] of tagData) {
      insertTag.run(tid, tag);
    }

    // ── Activity Logs ──────────────────────────────────────────────
    const insertActivity = db.prepare(`
      INSERT INTO activity_logs (entity_type, entity_id, action, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const activities = [
      ['project', projectIds[0], 'created', 'Project "Website Redesign" was created', '2026-07-01 09:01:00'],
      ['task', taskIds[0], 'created', 'Task "Audit current site performance" was created', '2026-07-02 10:01:00'],
      ['task', taskIds[0], 'completed', 'Task "Audit current site performance" was marked complete', '2026-07-15 09:05:00'],
      ['project', projectIds[1], 'created', 'Project "Mobile App v2" was created', '2026-07-05 10:01:00'],
      ['task', taskIds[5], 'created', 'Task "Design offline sync architecture" was created', '2026-07-10 09:01:00'],
      ['task', taskIds[5], 'status_changed', 'Task "Design offline sync architecture" moved to Review', '2026-07-24 16:05:00'],
      ['task', taskIds[1], 'completed', 'Task "Design new homepage wireframes" was marked complete', '2026-07-20 14:05:00'],
      ['project', projectIds[2], 'created', 'Project "API Gateway Migration" was created', '2026-06-15 08:01:00'],
      ['task', taskIds[9], 'completed', 'Task "Evaluate gateway options" was marked complete', '2026-06-28 17:05:00'],
      ['task', taskIds[2], 'status_changed', 'Task "Implement responsive navbar" moved to In Progress', '2026-07-25 10:05:00'],
      ['task', taskIds[6], 'status_changed', 'Task "Rebuild dashboard screen" moved to In Progress', '2026-07-25 09:05:00'],
      ['project', projectIds[3], 'archived', 'Project "Legacy CRM Cleanup" was archived', '2026-06-30 17:05:00'],
      ['task', taskIds[10], 'created', 'Task "Set up staging gateway environment" was created', '2026-07-01 10:01:00'],
      ['task', taskIds[11], 'created', 'Task "Migrate auth service behind gateway" was created', '2026-07-10 09:01:00'],
      ['task', taskIds[3], 'created', 'Task "Optimize image assets" was created', '2026-07-18 14:01:00'],
    ];

    for (const a of activities) {
      insertActivity.run(...a);
    }

    db.exec('COMMIT;');
    console.log('✅ Database seeded successfully.');
    console.log(`   ${pData.length} projects, ${tasks.length} tasks, ${activities.length} activity entries`);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

seed();
