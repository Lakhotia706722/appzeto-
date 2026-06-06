/**
 * Seed script for development/testing.
 * Run with: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];
const COLUMNS = ['todo', 'in-progress', 'review', 'done'];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Wipe existing seed data
  await Promise.all([
    User.deleteMany({ email: /@seed\.taskflow\.dev$/ }),
    Board.deleteMany({ title: /^Seed:/ }),
  ]);

  // ── Create 3 users ────────────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@seed.taskflow.dev', password: 'Admin@1234', role: 'admin', isEmailVerified: true },
    { name: 'Member User', email: 'member@seed.taskflow.dev', password: 'Member@1234', isEmailVerified: true },
    { name: 'Viewer User', email: 'viewer@seed.taskflow.dev', password: 'Viewer@1234', isEmailVerified: true },
  ]);

  const [admin, member, viewer] = users;

  const DEFAULT_COLUMNS_DEF = [
    { id: 'todo', title: 'To Do', color: '#71717a', position: 1000, isDefault: true },
    { id: 'in-progress', title: 'In Progress', color: '#3b82f6', position: 2000, isDefault: true },
    { id: 'review', title: 'Review', color: '#f59e0b', position: 3000, isDefault: true },
    { id: 'done', title: 'Done', color: '#22c55e', position: 4000, isDefault: true },
  ];

  const makeLabels = () => [
    { id: uuidv4(), name: 'Bug', color: '#ef4444' },
    { id: uuidv4(), name: 'Feature', color: '#6366f1' },
    { id: uuidv4(), name: 'Improvement', color: '#f59e0b' },
  ];

  // ── Create 2 boards ───────────────────────────────────────────────────────
  const boards = await Board.insertMany([
    {
      title: 'Seed: Product Roadmap',
      description: 'Main product roadmap board',
      coverColor: '#6366f1',
      createdBy: admin._id,
      members: [
        { user: admin._id, role: 'owner' },
        { user: member._id, role: 'member' },
        { user: viewer._id, role: 'viewer' },
      ],
      columns: DEFAULT_COLUMNS_DEF,
      labels: makeLabels(),
    },
    {
      title: 'Seed: Engineering Sprint',
      description: 'Sprint board for engineering team',
      coverColor: '#22c55e',
      createdBy: member._id,
      members: [
        { user: member._id, role: 'owner' },
        { user: admin._id, role: 'admin' },
        { user: viewer._id, role: 'viewer' },
      ],
      columns: DEFAULT_COLUMNS_DEF,
      labels: makeLabels(),
    },
  ]);

  // ── Create 20 tasks spread across boards, columns, priorities ─────────────
  const tasksData = [];
  for (let i = 0; i < 20; i++) {
    const board = boards[i % 2];
    const columnId = COLUMNS[i % 4];
    const priority = PRIORITIES[i % 5];
    const assignee = [admin._id, member._id][i % 2];
    const label = board.labels[i % 3].id;

    tasksData.push({
      title: `Task ${i + 1}: Sample task for ${board.title}`,
      description: `This is a seed task with priority **${priority}** in column _${columnId}_.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      board: board._id,
      columnId,
      position: (i + 1) * 1000,
      priority,
      status: columnId,
      assignedTo: [assignee],
      createdBy: admin._id,
      labels: [label],
      dueDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000), // some past, some future
      checklist: [
        { id: uuidv4(), text: 'Research approach', completed: i % 2 === 0 },
        { id: uuidv4(), text: 'Implement solution', completed: false },
        { id: uuidv4(), text: 'Write tests', completed: false },
      ],
    });
  }

  const tasks = await Task.insertMany(tasksData);

  // ── Add comments ──────────────────────────────────────────────────────────
  const comments = [];
  for (let i = 0; i < 10; i++) {
    const task = tasks[i];
    const board = boards.find((b) => b._id.toString() === task.board.toString());
    comments.push({
      task: task._id,
      board: board._id,
      author: [admin._id, member._id][i % 2],
      content: `Seed comment ${i + 1}: This task looks great! Keep up the good work.`,
    });
  }
  await Comment.insertMany(comments);

  // ── Activity log ──────────────────────────────────────────────────────────
  const activities = tasks.slice(0, 5).map((t) => ({
    board: t.board,
    task: t._id,
    actor: admin._id,
    action: 'task_created',
    meta: { taskTitle: t.title },
  }));
  await Activity.insertMany(activities);

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────');
  console.log('Test credentials:');
  console.log('  Admin:  admin@seed.taskflow.dev  /  Admin@1234');
  console.log('  Member: member@seed.taskflow.dev  /  Member@1234');
  console.log('  Viewer: viewer@seed.taskflow.dev  /  Viewer@1234');
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
