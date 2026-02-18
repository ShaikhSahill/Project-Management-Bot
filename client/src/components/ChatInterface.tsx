import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hello! 👋 I am your AI Project Manager.\n\nTry asking:\n• "Status of Project Alpha"\n• "Create Project X with 10 tasks"\n• "Who is on the frontend team?"' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_URL}/chat`, { message: input });
            const botMessage: Message = {
                sender: 'bot',
                text: res.data.response || "I didn't get a proper response."
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                sender: 'bot',
                text: "⚠️ Sorry, I'm having trouble connecting to the server. Please make sure all services are running."
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[500px] md:h-[580px] lg:h-[650px] w-full glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-base">AI Assistant</h3>
                            <p className="text-xs text-white/70">Powered by NLP</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                        </span>
                        <span className="text-xs font-medium">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex chat-message ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 shadow-lg shadow-purple-500/30">
                                🤖
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] p-3.5 text-sm shadow-md
                                ${msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md shadow-purple-500/20'
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-md'}`}
                        >
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={`${i > 0 ? 'mt-2' : ''} leading-relaxed`}>
                                    {line.startsWith('**') && line.endsWith('**') 
                                        ? <strong className="font-semibold">{line.slice(2, -2)}</strong>
                                        : line.startsWith('•') 
                                            ? <span className="flex items-start gap-2"><span className="text-purple-500">•</span>{line.slice(1)}</span>
                                            : line
                                    }
                                </p>
                            ))}
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm ml-2 flex-shrink-0 shadow-lg">
                                👤
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start chat-message">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 shadow-lg shadow-purple-500/30">
                            🤖
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 rounded-bl-md shadow-md">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full loading-dot"></span>
                                <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full loading-dot"></span>
                                <span className="w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full loading-dot"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-4 py-3 bg-gray-100 border-2 border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-purple-400 transition-all placeholder:text-gray-400"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="btn-glow bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                    >
                        <span className="hidden sm:inline">Send</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
