const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

// Get all projects with task counts
router.get('/', async (req, res, next) => {
    try {
        const projects = await Project.find().lean();

        // Add task counts manually since virtuals are tricky with lean() sometimes or just for clarity
        const projectsWithStats = await Promise.all(projects.map(async (p) => {
            const total = await Task.countDocuments({ project: p._id });
            const completed = await Task.countDocuments({ project: p._id, status: 'completed' }); // Fixed syntax error here
            return { ...p, totalTasks: total, completedTasks: completed };
        }));

        res.json({ success: true, data: projectsWithStats });
    } catch (error) {
        next(error);
    }
});

// Get single project details
router.get('/:id', async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const tasks = await Task.find({ project: req.params.id });

        res.json({ success: true, data: { project, tasks } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
