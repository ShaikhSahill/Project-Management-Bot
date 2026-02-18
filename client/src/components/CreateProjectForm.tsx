import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Team {
    _id: string;
    name: string;
    displayName: string;
    members: { name: string; role: string; currentWorkload: number }[];
}

interface TeamAllocation {
    teamName: string;
    taskCount: number;
    members: string[];
}

interface CreateProjectFormProps {
    onProjectCreated?: () => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onProjectCreated }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [totalTasks, setTotalTasks] = useState(10);
    const [deadline, setDeadline] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [allocations, setAllocations] = useState<TeamAllocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTeams();
        // Set default deadline to 30 days from now
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 30);
        setDeadline(defaultDeadline.toISOString().split('T')[0]);
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${API_URL}/teams`);
            setTeams(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch teams", error);
        }
    };

    const handleTeamToggle = (teamName: string) => {
        const existing = allocations.find(a => a.teamName === teamName);
        if (existing) {
            setAllocations(allocations.filter(a => a.teamName !== teamName));
        } else {
            const team = teams.find(t => t.name === teamName);
            setAllocations([...allocations, {
                teamName,
                taskCount: Math.ceil(totalTasks / (allocations.length + 1)),
                members: team?.members.map(m => m.name) || []
            }]);
        }
    };

    const updateAllocation = (teamName: string, taskCount: number) => {
        setAllocations(allocations.map(a => 
            a.teamName === teamName ? { ...a, taskCount } : a
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setIsLoading(true);

        try {
            // Build the creation command for the chat
            let command = `Create Project ${projectName} with ${totalTasks} tasks`;
            
            if (allocations.length > 0) {
                const teamParts = allocations.map(a => 
                    `${a.taskCount} for ${a.teamName}`
                ).join(', ');
                command += `: ${teamParts}`;
            }

            // Send via chat endpoint
            const res = await axios.post(`${API_URL}/chat`, {
                message: command
            });

            if (res.data.success) {
                setSuccess(`Project "${projectName}" created successfully!`);
                setProjectName('');
                setTotalTasks(10);
                setAllocations([]);
                
                if (onProjectCreated) {
                    onProjectCreated();
                }

                // Close form after 2 seconds
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess('');
                }, 2000);
            } else {
                setError(res.data.error || 'Failed to create project');
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    const allocatedTasks = allocations.reduce((sum, a) => sum + a.taskCount, 0);
    const remainingTasks = totalTasks - allocatedTasks;

    return (
        <div className="mb-6">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full btn-glow bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center justify-center gap-3"
            >
                <span className="text-2xl">{isOpen ? '−' : '+'}</span>
                <span>{isOpen ? 'Close Form' : 'Create New Project'}</span>
            </button>

            {/* Form */}
            {isOpen && (
                <div className="mt-4 glass-card rounded-2xl p-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-lg">📁</span>
                        Create New Project
                    </h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                            ✅ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Project Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Project Name *
                            </label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Enter project name..."
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-400 transition-all"
                                required
                            />
                        </div>

                        {/* Total Tasks & Deadline */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Total Tasks
                                </label>
                                <input
                                    type="number"
                                    value={totalTasks}
                                    onChange={(e) => setTotalTasks(parseInt(e.target.value) || 0)}
                                    min="1"
                                    max="100"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-400 transition-all"
                                />
                            </div>
                        </div>

                        {/* Team Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Assign Teams (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {teams.map((team) => {
                                    const isSelected = allocations.some(a => a.teamName === team.name);
                                    return (
                                        <button
                                            key={team._id}
                                            type="button"
                                            onClick={() => handleTeamToggle(team.name)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                isSelected 
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {team.displayName}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Allocation Sliders */}
                            {allocations.length > 0 && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Task Distribution</span>
                                        <span className={remainingTasks === 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                            {remainingTasks === 0 ? '✓ All assigned' : `${remainingTasks} unassigned`}
                                        </span>
                                    </div>
                                    {allocations.map((alloc) => (
                                        <div key={alloc.teamName} className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700 w-24 capitalize">
                                                {alloc.teamName}
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max={totalTasks}
                                                value={alloc.taskCount}
                                                onChange={(e) => updateAllocation(alloc.teamName, parseInt(e.target.value))}
                                                className="flex-1 accent-emerald-500"
                                            />
                                            <span className="text-sm font-bold text-gray-800 w-12 text-right">
                                                {alloc.taskCount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !projectName.trim()}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    Create Project
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CreateProjectForm;
