import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface TeamMember {
    name: string;
    role: string;
    currentWorkload: number;
    skills?: string[];
}

interface Team {
    _id: string;
    name: string;
    displayName: string;
    members: TeamMember[];
    memberCount: number;
    totalWorkload: number;
}

const TeamList: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${API_URL}/teams`);
            setTeams(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch teams", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
        const interval = setInterval(fetchTeams, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleTeam = (teamId: string) => {
        setExpandedTeam(expandedTeam === teamId ? null : teamId);
    };

    const getTeamGradient = (name: string) => {
        switch (name) {
            case 'frontend': return 'from-cyan-500 to-blue-500';
            case 'backend': return 'from-violet-500 to-purple-500';
            case 'testing': return 'from-emerald-500 to-green-500';
            case 'design': return 'from-pink-500 to-rose-500';
            case 'devops': return 'from-orange-500 to-amber-500';
            default: return 'from-gray-500 to-slate-500';
        }
    };

    const getTeamIcon = (name: string) => {
        switch (name) {
            case 'frontend': return '🎨';
            case 'backend': return '⚙️';
            case 'testing': return '🧪';
            case 'design': return '🖌️';
            case 'devops': return '🚀';
            default: return '👥';
        }
    };

    const getRoleStyle = (role: string) => {
        switch (role) {
            case 'lead': return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
            case 'developer': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white';
            case 'tester': return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white';
            case 'designer': return 'bg-gradient-to-r from-pink-400 to-rose-500 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    const getWorkloadBar = (workload: number) => {
        const maxWorkload = 8;
        const percent = Math.min((workload / maxWorkload) * 100, 100);
        let gradient = 'from-emerald-400 to-green-500';
        if (workload >= 6) gradient = 'from-red-400 to-rose-500';
        else if (workload >= 4) gradient = 'from-amber-400 to-orange-500';
        return { percent, gradient };
    };

    if (loading && teams.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-3">Loading teams...</p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl overflow-hidden card-hover">
            <div className="p-4 md:p-5 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm shadow-lg shadow-purple-500/30">👥</span>
                        Teams
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Click to expand</span>
                </div>
            </div>

            <div className="max-h-[380px] md:max-h-[450px] overflow-y-auto">
                {teams.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            <span className="text-3xl">👥</span>
                        </div>
                        <p className="text-gray-600 font-semibold">No teams found</p>
                        <p className="text-gray-400 text-sm mt-1">Run seed script to add data</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {teams.map((team, index) => (
                            <div 
                                key={team._id} 
                                className="m-2 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-purple-200"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Team Header */}
                                <div
                                    className="p-4 cursor-pointer flex justify-between items-center group"
                                    onClick={() => toggleTeam(team._id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTeamGradient(team.name)} flex items-center justify-center text-lg shadow-lg`}>
                                            {getTeamIcon(team.name)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                                                {team.displayName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <span>👤</span> {team.memberCount}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="flex items-center gap-1">
                                                    <span>📋</span> {team.totalWorkload} tasks
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs transition-transform duration-300 ${expandedTeam === team._id ? 'rotate-90 bg-purple-100 text-purple-600' : ''}`}>
                                        ▶
                                    </div>
                                </div>

                                {/* Team Members (Expanded) */}
                                <div className={`overflow-hidden transition-all duration-300 ${expandedTeam === team._id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100 p-2">
                                        {team.members.map((member, idx) => {
                                            const { percent, gradient } = getWorkloadBar(member.currentWorkload);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3 m-1 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-all"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getTeamGradient(team.name)} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getRoleStyle(member.role)}`}>
                                                                    {member.role}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-700">{member.currentWorkload}</p>
                                                            <p className="text-[10px] text-gray-400">tasks</p>
                                                        </div>
                                                    </div>
                                                    {/* Workload Bar */}
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`bg-gradient-to-r ${gradient} h-1.5 rounded-full transition-all duration-500`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamList;
