/**
 * Seed Script - Populates the database with dummy data for testing
 * Run with: node src/scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');

// Dummy Teams Data
const teamsData = [
    {
        name: 'frontend',
        displayName: 'Frontend Team',
        members: [
            { name: 'John Smith', email: 'john@company.com', role: 'lead', skills: ['React', 'TypeScript', 'CSS', 'Vue'], currentWorkload: 3 },
            { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'developer', skills: ['React', 'JavaScript', 'Tailwind'], currentWorkload: 5 },
            { name: 'Emily Davis', email: 'emily@company.com', role: 'developer', skills: ['Angular', 'TypeScript', 'SCSS'], currentWorkload: 2 },
            { name: 'Alex Chen', email: 'alex@company.com', role: 'developer', skills: ['React', 'Next.js', 'GraphQL'], currentWorkload: 4 },
        ]
    },
    {
        name: 'backend',
        displayName: 'Backend Team',
        members: [
            { name: 'Mike Wilson', email: 'mike@company.com', role: 'lead', skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL'], currentWorkload: 4 },
            { name: 'Tom Brown', email: 'tom@company.com', role: 'developer', skills: ['Java', 'Spring Boot', 'MySQL'], currentWorkload: 3 },
            { name: 'David Lee', email: 'david@company.com', role: 'developer', skills: ['Node.js', 'Express', 'MongoDB'], currentWorkload: 6 },
            { name: 'Chris Taylor', email: 'chris@company.com', role: 'developer', skills: ['Python', 'Django', 'PostgreSQL'], currentWorkload: 2 },
        ]
    },
    {
        name: 'testing',
        displayName: 'QA Testing Team',
        members: [
            { name: 'Lisa Anderson', email: 'lisa@company.com', role: 'lead', skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing'], currentWorkload: 3 },
            { name: 'James Martinez', email: 'james@company.com', role: 'tester', skills: ['Jest', 'Mocha', 'API Testing'], currentWorkload: 4 },
            { name: 'Rachel White', email: 'rachel@company.com', role: 'tester', skills: ['Cypress', 'Playwright', 'E2E Testing'], currentWorkload: 2 },
        ]
    },
    {
        name: 'design',
        displayName: 'Design Team',
        members: [
            { name: 'Jessica Moore', email: 'jessica@company.com', role: 'lead', skills: ['Figma', 'UI/UX', 'Adobe XD'], currentWorkload: 2 },
            { name: 'Kevin Clark', email: 'kevin@company.com', role: 'designer', skills: ['Figma', 'Illustrator', 'Prototyping'], currentWorkload: 3 },
        ]
    },
    {
        name: 'devops',
        displayName: 'DevOps Team',
        members: [
            { name: 'Ryan Garcia', email: 'ryan@company.com', role: 'lead', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], currentWorkload: 5 },
            { name: 'Amanda Hall', email: 'amanda@company.com', role: 'developer', skills: ['Azure', 'Terraform', 'Jenkins'], currentWorkload: 3 },
        ]
    }
];

// Dummy Projects Data
const projectsData = [
    {
        name: 'Project Alpha',
        description: 'E-commerce platform redesign with modern UI and improved checkout flow',
        deadline: new Date('2026-03-15'),
        status: 'active',
    },
    {
        name: 'Project Beta',
        description: 'Internal dashboard for real-time analytics and reporting',
        deadline: new Date('2026-04-30'),
        status: 'active',
    },
    {
        name: 'Project Gamma',
        description: 'Mobile app API development and integration',
        deadline: new Date('2026-02-28'),
        status: 'active',
    },
    {
        name: 'Project Delta',
        description: 'Customer support chatbot implementation',
        deadline: new Date('2026-05-15'),
        status: 'planning',
    },
    {
        name: 'Project Epsilon',
        description: 'Legacy system migration to cloud infrastructure',
        deadline: new Date('2026-06-30'),
        status: 'planning',
    }
];

// Task templates for each team category
const taskTemplates = {
    frontend: [
        'Implement responsive navigation component',
        'Create user dashboard layout',
        'Build form validation system',
        'Design and implement card components',
        'Add dark mode toggle feature',
        'Optimize bundle size and lazy loading',
        'Implement search functionality UI',
        'Create reusable modal component',
    ],
    backend: [
        'Design database schema',
        'Implement REST API endpoints',
        'Set up authentication middleware',
        'Create data validation layer',
        'Implement caching strategy',
        'Build notification service',
        'Create logging and monitoring',
        'Implement rate limiting',
    ],
    testing: [
        'Write unit tests for core modules',
        'Create E2E test suite',
        'Perform load testing',
        'Write integration tests',
        'Create test documentation',
        'Automated regression testing',
    ],
    design: [
        'Create wireframes and mockups',
        'Design component library',
        'Create user flow diagrams',
        'Design responsive layouts',
    ],
    devops: [
        'Set up CI/CD pipeline',
        'Configure staging environment',
        'Implement monitoring alerts',
        'Create deployment scripts',
    ]
};

async function seedDatabase() {
    try {
        await connectDB();
        console.log('🔗 Connected to database');

        // Clear existing data
        await Team.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        console.log('🧹 Cleared existing data');

        // Insert Teams
        const teams = await Team.insertMany(teamsData);
        console.log(`✅ Created ${teams.length} teams`);

        // Insert Projects
        const projects = await Project.insertMany(projectsData);
        console.log(`✅ Created ${projects.length} projects`);

        // Create Tasks for each project
        const allTasks = [];
        
        for (const project of projects) {
            // Random number of tasks per project (8-20)
            const taskCount = Math.floor(Math.random() * 13) + 8;
            
            // Distribute tasks across teams
            const teamDistribution = {
                frontend: Math.floor(taskCount * 0.3),
                backend: Math.floor(taskCount * 0.35),
                testing: Math.floor(taskCount * 0.2),
                design: Math.floor(taskCount * 0.1),
                devops: Math.floor(taskCount * 0.05) || 1,
            };

            for (const [teamName, count] of Object.entries(teamDistribution)) {
                const team = teams.find(t => t.name === teamName);
                if (!team || team.members.length === 0) continue;

                const templates = taskTemplates[teamName] || [];
                
                for (let i = 0; i < count; i++) {
                    // Round-robin assignment based on workload
                    const memberIndex = i % team.members.length;
                    const assignedMember = team.members[memberIndex];
                    
                    // Random status distribution
                    const statusRandom = Math.random();
                    let status = 'pending';
                    if (statusRandom < 0.4) status = 'completed';
                    else if (statusRandom < 0.7) status = 'in-progress';

                    const taskTitle = templates[i % templates.length] || `${teamName} Task ${i + 1}`;

                    allTasks.push({
                        title: `${taskTitle} - ${project.name}`,
                        project: project._id,
                        team: teamName,
                        assignedTo: assignedMember.name,
                        status: status,
                    });
                }
            }
        }

        await Task.insertMany(allTasks);
        console.log(`✅ Created ${allTasks.length} tasks`);

        // Summary
        console.log('\n📊 Database Seed Summary:');
        console.log('========================');
        
        for (const team of teams) {
            console.log(`\n👥 ${team.displayName}:`);
            team.members.forEach(m => {
                console.log(`   - ${m.name} (${m.role}) - Skills: ${m.skills.join(', ')}`);
            });
        }

        console.log('\n📁 Projects Created:');
        for (const project of projects) {
            const taskCount = allTasks.filter(t => t.project.equals(project._id)).length;
            const completedCount = allTasks.filter(t => t.project.equals(project._id) && t.status === 'completed').length;
            console.log(`   - ${project.name}: ${taskCount} tasks (${completedCount} completed)`);
        }

        console.log('\n✨ Seed complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDatabase();
