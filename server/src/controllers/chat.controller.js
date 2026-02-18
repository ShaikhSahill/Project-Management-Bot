const axios = require('axios');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');

// Get AI Service URL from env
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Fetches complete project data with task statistics
 */
async function getFullProjectsContext() {
    const projects = await Project.find({}).lean();
    
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, status: 'completed' });
        const inProgressTasks = await Task.countDocuments({ project: project._id, status: 'in-progress' });
        const pendingTasks = await Task.countDocuments({ project: project._id, status: 'pending' });
        
        // Get assigned team members
        const tasks = await Task.find({ project: project._id }, 'assignedTo team').lean();
        const uniqueMembers = [...new Set(tasks.map(t => t.assignedTo).filter(Boolean))];
        const assignedTeam = [...new Set(tasks.map(t => t.team).filter(Boolean))].join(', ') || 'Not assigned';
        
        return {
            name: project.name,
            status: project.status,
            deadline: project.deadline,
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            assignedTeam,
            assignedMembers: uniqueMembers
        };
    }));
    
    return projectsWithStats;
}

/**
 * Fetches complete team data with member workloads
 */
async function getFullTeamsContext() {
    const teams = await Team.find({}).lean();
    
    return teams.map(team => ({
        name: team.name,
        displayName: team.displayName,
        members: team.members.map(m => ({
            name: m.name,
            email: m.email,
            role: m.role,
            skills: m.skills || [],
            currentWorkload: m.currentWorkload || 0
        }))
    }));
}

exports.handleChat = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        console.log(`📨 User Message: ${message}`);

        // Fetch full context from database
        const [projects, teams] = await Promise.all([
            getFullProjectsContext(),
            getFullTeamsContext()
        ]);

        console.log(`📊 Context: ${projects.length} projects, ${teams.length} teams`);

        // First, try simple intent detection for creation commands
        const lowerMsg = message.toLowerCase();
        const isCreateCommand = lowerMsg.includes('create') && lowerMsg.includes('project');
        
        if (isCreateCommand) {
            // Use legacy NLP for project creation
            try {
                const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, { query: message });
                const { intent, data, reply } = aiResponse.data;
                
                if (intent === 'create_project') {
                    const finalResponse = await handleProjectCreation(data, reply);
                    return res.json({ success: true, response: finalResponse });
                }
            } catch (error) {
                console.warn('NLP analyze failed, falling back to Gemini:', error.message);
            }
        }

        // Use Gemini for all other queries with full context
        try {
            const geminiResponse = await axios.post(`${AI_SERVICE_URL}/chat`, {
                query: message,
                projects: projects,
                teams: teams
            });

            const response = geminiResponse.data.reply;
            return res.json({ 
                success: true, 
                response: response,
                gemini_enabled: geminiResponse.data.gemini_enabled
            });

        } catch (error) {
            console.error('❌ Error connecting to AI Service:', error.message);
            
            // Fallback response with available data
            const fallbackResponse = generateFallbackResponse(message, projects, teams);
            return res.json({ success: true, response: fallbackResponse });
        }

    } catch (error) {
        console.error('❌ Chat Handler Error:', error);
        next(error);
    }
};

/**
 * Generates a fallback response when AI service is unavailable
 */
function generateFallbackResponse(query, projects, teams) {
    const lowerQuery = query.toLowerCase();
    
    // Project status query
    if (lowerQuery.includes('status') || lowerQuery.includes('progress') || lowerQuery.includes('project')) {
        if (projects.length === 0) {
            return "No projects found. Try creating one using the form above!";
        }
        
        // Check if asking about a SPECIFIC project
        const matchedProject = projects.find(p => 
            lowerQuery.includes(p.name.toLowerCase()) ||
            lowerQuery.includes(p.name.replace('Project ', '').toLowerCase())
        );
        
        if (matchedProject) {
            // Return details for the SPECIFIC project
            const progress = matchedProject.totalTasks > 0 
                ? Math.round((matchedProject.completedTasks / matchedProject.totalTasks) * 100) 
                : 0;
            return `📊 **${matchedProject.name}** Status\n\n• Progress: ${progress}% (${matchedProject.completedTasks}/${matchedProject.totalTasks} tasks completed)\n• In Progress: ${matchedProject.inProgressTasks || 0} tasks\n• Pending: ${matchedProject.pendingTasks || 0} tasks\n• Status: ${matchedProject.status}\n• Deadline: ${matchedProject.deadline ? new Date(matchedProject.deadline).toLocaleDateString() : 'Not set'}\n• Team: ${matchedProject.assignedTeam || 'Not assigned'}`;
        }
        
        // No specific project mentioned - list all
        const projectList = projects.map(p => {
            const progress = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
            return `• **${p.name}** - ${p.status} (${progress}% complete, ${p.completedTasks}/${p.totalTasks} tasks)`;
        }).join('\n');
        
        return `📋 **All Projects:**\n${projectList}`;
    }
    
    // Team query
    if (lowerQuery.includes('team') || lowerQuery.includes('member') || lowerQuery.includes('who')) {
        if (teams.length === 0) {
            return "No teams found. Please run the seed script to add dummy data.";
        }
        
        // Check if asking about a SPECIFIC team
        const matchedTeam = teams.find(t => 
            lowerQuery.includes(t.name.toLowerCase()) ||
            lowerQuery.includes(t.displayName.toLowerCase())
        );
        
        if (matchedTeam) {
            // Return details for the SPECIFIC team
            const members = matchedTeam.members || [];
            const memberList = members.map(m => 
                `  • ${m.name} (${m.role}) - ${m.currentWorkload || 0} tasks`
            ).join('\n');
            return `👥 **${matchedTeam.displayName}**\n\nMembers (${members.length}):\n${memberList}`;
        }
        
        const teamList = teams.map(t => {
            const avgWorkload = t.members.length > 0 
                ? Math.round(t.members.reduce((sum, m) => sum + m.currentWorkload, 0) / t.members.length) 
                : 0;
            return `• **${t.displayName}** - ${t.members.length} members (avg workload: ${avgWorkload} tasks)`;
        }).join('\n');
        
        return `👥 **All Teams:**\n${teamList}`;
    }
    
    return `I can help with:\n• **Project status**: "Show all projects" or "Status of Project X"\n• **Team info**: "Who is on the frontend team?"\n• **Create project**: Use the form above or say "Create Project X"\n\nCurrently tracking ${projects.length} projects and ${teams.length} teams.`;
}

/**
 * Handles bulk project and task creation
 * Validates data and creates entries in database
 */
async function handleProjectCreation(data, aiReply) {
    const { projectName, totalTasks, teams, autoDistributed } = data;

    if (!projectName) {
        return "I need a project name to create. Try: 'Create Project X with 10 tasks'";
    }

    // Check if project already exists
    const existingProject = await Project.findOne({
        name: { $regex: new RegExp(`^${projectName}$`, 'i') }
    });

    if (existingProject) {
        return `Project "${projectName}" already exists! Would you like to:\n• Check its status: "Status of ${projectName}"\n• Create a different project`;
    }

    // If no tasks specified, just create the project
    if (!totalTasks || totalTasks === 0) {
        const newProject = await Project.create({
            name: projectName,
            status: 'planning',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        return `✅ Created **${projectName}** (planning stage).\n\nTo add tasks, try:\n"Create 10 tasks for ${projectName}"`;
    }

    // Create Project
    const newProject = await Project.create({
        name: projectName,
        status: 'active',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Create Tasks
    const tasksToCreate = [];
    const teamSummary = [];

    for (const team of (teams || [])) {
        const memberCount = team.members?.length || 0;
        if (memberCount === 0) continue;

        teamSummary.push(`${team.name}: ${team.count} tasks`);

        for (let i = 0; i < team.count; i++) {
            // Round-robin assignment
            const assignedMember = team.members[i % memberCount];

            tasksToCreate.push({
                title: `${team.name.charAt(0).toUpperCase() + team.name.slice(1)} Task ${i + 1} - ${projectName}`,
                project: newProject._id,
                team: team.name.toLowerCase(),
                assignedTo: assignedMember,
                status: 'pending'
            });
        }

        // Update member workloads in Team collection
        try {
            const teamDoc = await Team.findOne({ name: team.name.toLowerCase() });
            if (teamDoc) {
                for (const memberName of team.members) {
                    const member = teamDoc.members.find(
                        m => m.name.toLowerCase() === memberName.toLowerCase()
                    );
                    if (member) {
                        const tasksAssigned = Math.ceil(team.count / team.members.length);
                        member.currentWorkload += tasksAssigned;
                    }
                }
                await teamDoc.save();
            }
        } catch (err) {
            console.warn('Warning: Could not update team workloads:', err.message);
        }
    }

    if (tasksToCreate.length > 0) {
        await Task.insertMany(tasksToCreate);
    }

    // Build response
    let response = `✅ Successfully created **${projectName}**!\n\n`;
    response += `📋 **${tasksToCreate.length} tasks** created:\n`;
    
    for (const summary of teamSummary) {
        response += `  • ${summary}\n`;
    }

    if (autoDistributed) {
        response += `\n🤖 Tasks were auto-distributed based on team workload balancing.`;
    }

    response += `\n\n💡 Check progress anytime: "Status of ${projectName}"`;

    return response;
}
