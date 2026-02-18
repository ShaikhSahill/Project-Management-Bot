const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'completed', 'on-hold'],
        default: 'planning',
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual to populate tasks if needed
ProjectSchema.virtual('totalTasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project',
    count: true
});

module.exports = mongoose.model('Project', ProjectSchema);
