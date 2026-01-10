import React, { useEffect, useState } from 'react';
import { Moon, Sun, Code, PenTool, LogOut, Menu, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleLeftSidebar, toggleRightSidebar }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [userInitials, setUserInitials] = useState('U');
    const [userInfo, setUserInfo] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();

    // Toggle theme logic
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo && storedUserInfo.name) {
            setUserInfo(storedUserInfo);
            const initials = storedUserInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            setUserInitials(initials);
        }
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <nav className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 sm:px-6 z-50 relative">
            {/* Left - Menu Button & User Profile */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Mobile Menu Button (Left Sidebar) */}
                <button
                    onClick={toggleLeftSidebar}
                    className="p-2 md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md bg-transparent"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Profile */}
                <div className="relative group">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white dark:ring-gray-800 transition-transform transform hover:scale-105 focus:outline-none"
                    >
                        {userInitials}
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileOpen(false)}
                            />
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 transform transition-all duration-200 ease-out origin-top-left ml-1">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {userInitials}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {userInfo?.name || 'User'}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {userInfo?.email || 'user@example.com'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Profile Actions */}
                                    <div className="pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Center - Application Name */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <span className="md:hidden">Collab</span>
                    <span className="hidden md:inline">Collaborative Platform</span>
                </h1>
            </div>

            {/* Right - Chat Toggle */}
            <div className="flex items-center space-x-3">
                <button
                    onClick={toggleRightSidebar}
                    className="p-2 md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md bg-transparent"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
