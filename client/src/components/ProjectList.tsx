import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Project {
    _id: string;
    name: string;
    status: string;
    deadline: string;
    totalTasks: number;
    completedTasks: number;
}

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`);
            setProjects(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        const interval = setInterval(fetchProjects, 5000);
        return () => clearInterval(interval);
    }, []);

    const getProgressGradient = (percent: number) => {
        if (percent >= 75) return 'from-emerald-400 to-green-500';
        if (percent >= 50) return 'from-blue-400 to-indigo-500';
        if (percent >= 25) return 'from-amber-400 to-orange-500';
        return 'from-red-400 to-rose-500';
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active': return { bg: 'bg-gradient-to-r from-blue-500 to-indigo-500', text: 'text-white' };
            case 'completed': return { bg: 'bg-gradient-to-r from-emerald-500 to-green-500', text: 'text-white' };
            case 'on-hold': return { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white' };
            default: return { bg: 'bg-gray-200', text: 'text-gray-600' };
        }
    };

    if (loading && projects.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-3">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl overflow-hidden card-hover">
            <div className="p-4 md:p-5 border-b border-gray-100/50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-lg shadow-blue-500/30">📁</span>
                    Projects
                </h2>
                <span className="inline-flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live
                </span>
            </div>
            <div className="max-h-[380px] md:max-h-[450px] overflow-y-auto">
                {projects.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            <span className="text-3xl">📋</span>
                        </div>
                        <p className="text-gray-600 font-semibold">No projects yet</p>
                        <p className="text-gray-400 text-sm mt-1">Try: "Create Project X with 10 tasks"</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {projects.map((project, index) => {
                            const percent = project.totalTasks ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
                            const statusConfig = getStatusConfig(project.status);
                            return (
                                <div 
                                    key={project._id} 
                                    className="p-4 m-2 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getProgressGradient(percent)}`}></div>
                                            <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{project.name}</h3>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} shadow-sm`}>
                                            {project.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                                            <span>📅</span>
                                            <span className="font-medium">{new Date(project.deadline).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                                            <span>✅</span>
                                            <span className="font-medium">{project.completedTasks}/{project.totalTasks} tasks</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative">
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`bg-gradient-to-r ${getProgressGradient(percent)} h-2.5 rounded-full transition-all duration-1000 ease-out relative`}
                                                style={{ width: `${percent}%` }}
                                            >
                                                <div className="absolute inset-0 progress-shimmer rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="absolute -top-1 right-0 text-xs font-bold text-gray-700">
                                            {percent}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
