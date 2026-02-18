require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chat.routes');
const projectRoutes = require('./routes/project.routes');
const teamRoutes = require('./routes/team.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ProjectAlloc Backend API', status: 'running' });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'project-alloc-backend', timestamp: new Date().toISOString() });
});

// Seed endpoint for production
app.get('/api/seed', async (req, res) => {
  try {
    const Team = require('./models/Team');
    const Project = require('./models/Project');
    const Task = require('./models/Task');
    const force = req.query.force === 'true';

    // Check if already seeded
    const existingTeams = await Team.countDocuments();
    if (existingTeams > 0 && !force) {
      return res.json({ success: true, message: 'Database already seeded. Use ?force=true to reseed', teams: existingTeams });
    }

    // Teams data
    const teamsData = [
      { name: 'frontend', displayName: 'Frontend Team', members: [
        { name: 'John Smith', email: 'john@company.com', role: 'lead', skills: ['React', 'TypeScript', 'CSS', 'Vue'], currentWorkload: 3 },
        { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'developer', skills: ['React', 'JavaScript', 'Tailwind'], currentWorkload: 5 },
        { name: 'Emily Davis', email: 'emily@company.com', role: 'developer', skills: ['Angular', 'TypeScript', 'SCSS'], currentWorkload: 2 },
        { name: 'Alex Chen', email: 'alex@company.com', role: 'developer', skills: ['React', 'Next.js', 'GraphQL'], currentWorkload: 4 },
      ]},
      { name: 'backend', displayName: 'Backend Team', members: [
        { name: 'Mike Wilson', email: 'mike@company.com', role: 'lead', skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL'], currentWorkload: 4 },
        { name: 'Tom Brown', email: 'tom@company.com', role: 'developer', skills: ['Java', 'Spring Boot', 'MySQL'], currentWorkload: 3 },
        { name: 'David Lee', email: 'david@company.com', role: 'developer', skills: ['Node.js', 'Express', 'MongoDB'], currentWorkload: 6 },
        { name: 'Chris Taylor', email: 'chris@company.com', role: 'developer', skills: ['Python', 'Django', 'PostgreSQL'], currentWorkload: 2 },
      ]},
      { name: 'testing', displayName: 'QA Testing Team', members: [
        { name: 'Lisa Anderson', email: 'lisa@company.com', role: 'lead', skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing'], currentWorkload: 3 },
        { name: 'James Martinez', email: 'james@company.com', role: 'tester', skills: ['Jest', 'Mocha', 'API Testing'], currentWorkload: 4 },
        { name: 'Rachel White', email: 'rachel@company.com', role: 'tester', skills: ['Cypress', 'Playwright', 'E2E Testing'], currentWorkload: 2 },
      ]},
      { name: 'design', displayName: 'Design Team', members: [
        { name: 'Jessica Moore', email: 'jessica@company.com', role: 'lead', skills: ['Figma', 'UI/UX', 'Adobe XD'], currentWorkload: 2 },
        { name: 'Kevin Clark', email: 'kevin@company.com', role: 'designer', skills: ['Figma', 'Illustrator', 'Prototyping'], currentWorkload: 3 },
      ]},
      { name: 'devops', displayName: 'DevOps Team', members: [
        { name: 'Ryan Garcia', email: 'ryan@company.com', role: 'lead', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], currentWorkload: 5 },
        { name: 'Amanda Hall', email: 'amanda@company.com', role: 'developer', skills: ['Azure', 'Terraform', 'Jenkins'], currentWorkload: 3 },
      ]},
    ];

    // Projects data
    const projectsData = [
      { name: 'Project Alpha', description: 'E-commerce platform redesign with modern UI and improved checkout flow', deadline: new Date('2026-03-15'), status: 'active' },
      { name: 'Project Beta', description: 'Internal dashboard for real-time analytics and reporting', deadline: new Date('2026-04-30'), status: 'active' },
      { name: 'Project Gamma', description: 'Mobile app API development and integration', deadline: new Date('2026-02-28'), status: 'active' },
      { name: 'Project Delta', description: 'Customer support chatbot implementation', deadline: new Date('2026-05-15'), status: 'planning' },
      { name: 'Project Epsilon', description: 'Legacy system migration to cloud infrastructure', deadline: new Date('2026-06-30'), status: 'planning' },
    ];

    await Team.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    const teams = await Team.insertMany(teamsData);
    const projects = await Project.insertMany(projectsData);

    // Create tasks for each project
    const tasks = [
      // Project Alpha tasks
      { title: 'Design homepage mockups', project: projects[0]._id, team: 'design', assignedTo: 'Jessica Moore', status: 'completed' },
      { title: 'Implement responsive navigation', project: projects[0]._id, team: 'frontend', assignedTo: 'John Smith', status: 'completed' },
      { title: 'Create product listing API', project: projects[0]._id, team: 'backend', assignedTo: 'Mike Wilson', status: 'in-progress' },
      { title: 'Build shopping cart component', project: projects[0]._id, team: 'frontend', assignedTo: 'Sarah Johnson', status: 'in-progress' },
      { title: 'Setup payment gateway', project: projects[0]._id, team: 'backend', assignedTo: 'Tom Brown', status: 'pending' },
      { title: 'Write E2E tests for checkout', project: projects[0]._id, team: 'testing', assignedTo: 'Lisa Anderson', status: 'pending' },
      // Project Beta tasks
      { title: 'Create dashboard wireframes', project: projects[1]._id, team: 'design', assignedTo: 'Kevin Clark', status: 'completed' },
      { title: 'Build analytics widgets', project: projects[1]._id, team: 'frontend', assignedTo: 'Emily Davis', status: 'in-progress' },
      { title: 'Implement data aggregation API', project: projects[1]._id, team: 'backend', assignedTo: 'David Lee', status: 'in-progress' },
      { title: 'Setup real-time WebSocket', project: projects[1]._id, team: 'backend', assignedTo: 'Chris Taylor', status: 'pending' },
      { title: 'Unit tests for API endpoints', project: projects[1]._id, team: 'testing', assignedTo: 'James Martinez', status: 'pending' },
      // Project Gamma tasks
      { title: 'Design mobile API architecture', project: projects[2]._id, team: 'backend', assignedTo: 'Mike Wilson', status: 'completed' },
      { title: 'Implement authentication API', project: projects[2]._id, team: 'backend', assignedTo: 'Tom Brown', status: 'in-progress' },
      { title: 'Build user profile endpoints', project: projects[2]._id, team: 'backend', assignedTo: 'David Lee', status: 'pending' },
      { title: 'API integration tests', project: projects[2]._id, team: 'testing', assignedTo: 'Rachel White', status: 'pending' },
      // Project Delta tasks
      { title: 'Chatbot conversation design', project: projects[3]._id, team: 'design', assignedTo: 'Jessica Moore', status: 'in-progress' },
      { title: 'NLP model integration', project: projects[3]._id, team: 'backend', assignedTo: 'Chris Taylor', status: 'pending' },
      { title: 'Chat UI components', project: projects[3]._id, team: 'frontend', assignedTo: 'Alex Chen', status: 'pending' },
      // Project Epsilon tasks
      { title: 'Cloud architecture planning', project: projects[4]._id, team: 'devops', assignedTo: 'Ryan Garcia', status: 'in-progress' },
      { title: 'Setup AWS infrastructure', project: projects[4]._id, team: 'devops', assignedTo: 'Amanda Hall', status: 'pending' },
      { title: 'Database migration scripts', project: projects[4]._id, team: 'backend', assignedTo: 'Mike Wilson', status: 'pending' },
    ];
    await Task.insertMany(tasks);

    res.json({ success: true, message: 'Database seeded!', teams: teams.length, projects: projects.length, tasks: tasks.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
