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

    // Check if already seeded
    const existingTeams = await Team.countDocuments();
    if (existingTeams > 0) {
      return res.json({ success: true, message: 'Database already seeded', teams: existingTeams });
    }

    // Teams data
    const teamsData = [
      { name: 'frontend', displayName: 'Frontend Team', members: [
        { name: 'John Smith', email: 'john@company.com', role: 'lead', skills: ['React', 'TypeScript', 'CSS'], currentWorkload: 3 },
        { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'developer', skills: ['React', 'JavaScript'], currentWorkload: 5 },
      ]},
      { name: 'backend', displayName: 'Backend Team', members: [
        { name: 'Mike Wilson', email: 'mike@company.com', role: 'lead', skills: ['Node.js', 'Python', 'MongoDB'], currentWorkload: 4 },
        { name: 'Tom Brown', email: 'tom@company.com', role: 'developer', skills: ['Java', 'Spring Boot'], currentWorkload: 3 },
      ]},
      { name: 'testing', displayName: 'QA Team', members: [
        { name: 'Lisa Anderson', email: 'lisa@company.com', role: 'lead', skills: ['Selenium', 'Jest', 'Cypress'], currentWorkload: 3 },
      ]},
    ];

    // Projects data
    const projectsData = [
      { name: 'Project Alpha', description: 'E-commerce platform redesign', deadline: new Date('2026-03-15'), status: 'active' },
      { name: 'Project Beta', description: 'Internal dashboard for analytics', deadline: new Date('2026-04-30'), status: 'active' },
    ];

    await Team.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    const teams = await Team.insertMany(teamsData);
    const projects = await Project.insertMany(projectsData);

    // Create some tasks
    const tasks = [
      { title: 'Setup project structure', project: projects[0]._id, team: 'frontend', assignedTo: 'John Smith', status: 'completed' },
      { title: 'Implement API endpoints', project: projects[0]._id, team: 'backend', assignedTo: 'Mike Wilson', status: 'in-progress' },
      { title: 'Write unit tests', project: projects[1]._id, team: 'testing', assignedTo: 'Lisa Anderson', status: 'pending' },
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
