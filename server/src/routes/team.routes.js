const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Get all teams
router.get('/', async (req, res, next) => {
    try {
        const teams = await Team.find().lean();
        
        // Calculate stats for each team
        const teamsWithStats = teams.map(team => ({
            ...team,
            memberCount: team.members ? team.members.length : 0,
            totalWorkload: team.members ? team.members.reduce((sum, m) => sum + (m.currentWorkload || 0), 0) : 0
        }));

        res.json({ success: true, data: teamsWithStats });
    } catch (error) {
        next(error);
    }
});

// Get single team with members
router.get('/:name', async (req, res, next) => {
    try {
        const team = await Team.findOne({ 
            name: req.params.name.toLowerCase() 
        });
        
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                error: `Team '${req.params.name}' not found` 
            });
        }

        res.json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
});

// Get team members with lowest workload
router.get('/:name/available', async (req, res, next) => {
    try {
        const count = parseInt(req.query.count) || 3;
        const team = await Team.findOne({ 
            name: req.params.name.toLowerCase() 
        });
        
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                error: `Team '${req.params.name}' not found` 
            });
        }

        // Sort by workload (ascending) and return top N
        const availableMembers = [...team.members]
            .sort((a, b) => a.currentWorkload - b.currentWorkload)
            .slice(0, count);

        res.json({ 
            success: true, 
            data: {
                team: team.name,
                availableMembers
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update member workload (after task assignment)
router.patch('/:teamName/members/:memberName/workload', async (req, res, next) => {
    try {
        const { teamName, memberName } = req.params;
        const { increment = 1 } = req.body;

        const team = await Team.findOne({ name: teamName.toLowerCase() });
        
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                error: `Team '${teamName}' not found` 
            });
        }

        const member = team.members.find(
            m => m.name.toLowerCase() === memberName.toLowerCase()
        );

        if (!member) {
            return res.status(404).json({ 
                success: false, 
                error: `Member '${memberName}' not found in ${teamName} team` 
            });
        }

        member.currentWorkload += increment;
        await team.save();

        res.json({ 
            success: true, 
            data: { 
                member: member.name, 
                newWorkload: member.currentWorkload 
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get all members across all teams (flat list)
router.get('/all/members', async (req, res, next) => {
    try {
        const teams = await Team.find().lean();
        
        const allMembers = [];
        for (const team of teams) {
            for (const member of team.members || []) {
                allMembers.push({
                    ...member,
                    team: team.name,
                    teamDisplayName: team.displayName
                });
            }
        }

        res.json({ 
            success: true, 
            data: allMembers,
            count: allMembers.length
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
