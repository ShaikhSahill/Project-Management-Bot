import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ProjectList from './components/ProjectList';
import TeamList from './components/TeamList';
import CreateProjectForm from './components/CreateProjectForm';
import './index.css';

function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleProjectCreated = () => {
        // Trigger refresh of project and team lists
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen text-gray-900 font-sans p-3 md:p-6 lg:p-8">
            <div className="max-w-[1700px] mx-auto">
                {/* Header */}
                <header className="mb-5 md:mb-6">
                    <div className="glass-card rounded-2xl p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg shadow-purple-500/30">
                                    🤖
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">
                                        <span className="gradient-text">AI Project Manager</span>
                                    </h1>
                                    <p className="text-gray-500 mt-0.5 text-xs md:text-sm">
                                        Powered by Google Gemini AI
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    Gemini AI Active
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
                    {/* Left Column: Chat */}
                    <section className="lg:col-span-5 order-1">
                        <div className="lg:sticky lg:top-4 space-y-4">
                            <ChatInterface key={`chat-${refreshKey}`} />
                        </div>
                    </section>

                    {/* Middle Column: Create Form + Projects */}
                    <section className="lg:col-span-4 space-y-4 md:space-y-5 order-2">
                        {/* Create Project Form */}
                        <CreateProjectForm onProjectCreated={handleProjectCreated} />
                        
                        {/* Projects List */}
                        <ProjectList key={`projects-${refreshKey}`} />
                    </section>

                    {/* Right Column: Teams */}
                    <section className="lg:col-span-3 order-3">
                        <TeamList key={`teams-${refreshKey}`} />
                    </section>
                </main>

                {/* Footer */}
                <footer className="mt-6 text-center">
                    <p className="text-gray-500 text-xs">
                        Powered by <span className="font-semibold text-purple-600">Google Gemini</span> • <span className="font-semibold text-blue-600">FastAPI</span> • <span className="font-semibold text-green-600">Node.js</span> • <span className="font-semibold text-cyan-600">React</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}

export default App;
