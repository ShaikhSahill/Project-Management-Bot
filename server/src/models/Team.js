const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['developer', 'designer', 'tester', 'lead', 'manager'],
        default: 'developer',
    },
    skills: [{
        type: String,
    }],
    currentWorkload: {
        type: Number,
        default: 0, // Number of tasks currently assigned
    },
});

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['frontend', 'backend', 'testing', 'design', 'devops'],
    },
    displayName: {
        type: String,
        required: true,
    },
    members: [TeamMemberSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Static method to get team member by name
TeamSchema.statics.findMemberByName = async function(memberName) {
    const teams = await this.find();
    for (const team of teams) {
        const member = team.members.find(
            m => m.name.toLowerCase() === memberName.toLowerCase()
        );
        if (member) {
            return { team: team.name, member };
        }
    }
    return null;
};

// Static method to get members with lowest workload
TeamSchema.statics.getMembersWithLowestWorkload = async function(teamName, count = 1) {
    const team = await this.findOne({ name: teamName.toLowerCase() });
    if (!team) return [];
    
    return team.members
        .sort((a, b) => a.currentWorkload - b.currentWorkload)
        .slice(0, count);
};

module.exports = mongoose.model('Team', TeamSchema);
