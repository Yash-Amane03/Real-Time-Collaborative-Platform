import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import FileExplorer from '../components/fileExplorer/FileExplorer';
import Chat from '../components/chat/Chat';
import ChatList from '../components/chat/ChatList';
import EditorCanvas from '../components/EditorCanvas';
import { Code, PenTool } from 'lucide-react';

const Dashboard = () => {
    const [activeView, setActiveView] = useState('canvas'); // 'canvas' or 'editor'
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    // File System State
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('// Select a file to view or edit');

    // Chat State
    const [activeChat, setActiveChat] = useState({ type: 'room', id: 'general', name: 'General' });

    // Sidebar Widths States
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(320);

    // Left Sidebar Vertical Split State (Height % of top section)
    const [topSectionHeight, setTopSectionHeight] = useState(50);

    // Handle File Selection from Explorer
    const handleFileSelect = (file) => {
        setSelectedFile(file);
        if (file && file.type === 'file') {
            setFileContent(file.content || '');
            setActiveView('editor'); // Switch to editor when a file is opened
        }
    };

    // Resize Handlers
    const startResizingLeft = React.useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startX = mouseDownEvent.clientX;
        const startWidth = leftSidebarWidth;

        const doDrag = (mouseMoveEvent) => {
            const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
            if (newWidth >= 160 && newWidth <= 480) {
                setLeftSidebarWidth(newWidth);
            }
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'col-resize';
    }, [leftSidebarWidth]);

    const startResizingVertical = React.useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startY = mouseDownEvent.clientY;
        const startHeight = topSectionHeight;

        // Get total height of sidebar to calculate percentage
        const sidebarHeight = mouseDownEvent.target.parentElement.offsetHeight;

        const doDrag = (mouseMoveEvent) => {
            const deltaPixels = mouseMoveEvent.clientY - startY;
            const deltaPercentage = (deltaPixels / sidebarHeight) * 100;
            const newHeight = startHeight + deltaPercentage;

            // Restrict between 20% and 80%
            if (newHeight >= 20 && newHeight <= 80) {
                setTopSectionHeight(newHeight);
            }
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'row-resize';
    }, [topSectionHeight]);

    const startResizingRight = React.useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        const startX = mouseDownEvent.clientX;
        const startWidth = rightSidebarWidth;

        const doDrag = (mouseMoveEvent) => {
            // Dragging left INCREASES width for right sidebar
            const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
            // Min 240px, Max 500px
            if (newWidth >= 240 && newWidth <= 500) {
                setRightSidebarWidth(newWidth);
            }
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'col-resize';
    }, [rightSidebarWidth]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Navbar
                toggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                toggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            />

            <div className="flex flex-1 overflow-hidden relative">

                {/* Mobile Backdrop Overlay */}
                {(isLeftSidebarOpen || isRightSidebarOpen) && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
                        onClick={() => {
                            setIsLeftSidebarOpen(false);
                            setIsRightSidebarOpen(false);
                        }}
                    />
                )}

                {/* Left Sidebar - Desktop (Resizable) */}
                <div
                    className="hidden md:flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 relative transition-none h-full"
                    style={{ width: leftSidebarWidth }}
                >
                    {/* Top Section: File Explorer */}
                    <div
                        className="flex-col overflow-hidden flex border-b border-gray-200 dark:border-gray-700 relative"
                        style={{ height: `${topSectionHeight}%` }}
                    >
                        <div className="flex-1 overflow-auto">
                            <FileExplorer onFileSelect={handleFileSelect} />
                        </div>
                    </div>

                    {/* Vertical Resizer Handle */}
                    <div
                        className="h-1 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors z-10 w-full flex-shrink-0"
                        onMouseDown={startResizingVertical}
                    />

                    {/* Bottom Section: Chat List (Public/Private Names) */}
                    <div
                        className="flex flex-col overflow-hidden bg-white dark:bg-gray-800"
                        style={{ height: `${100 - topSectionHeight}%` }}
                    >
                        <ChatList onSelectChat={setActiveChat} />
                    </div>

                    {/* Left Resizer Handle (Width) */}
                    <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50 opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-600"
                        onMouseDown={startResizingLeft}
                    />
                </div>

                {/* Left Sidebar - Mobile (Drawer) */}
                <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:hidden shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div
                        className="flex-col overflow-hidden flex border-b border-gray-200 dark:border-gray-700 relative"
                        style={{ height: `${topSectionHeight}%` }}
                    >
                        <div className="flex-1 overflow-auto">
                            <FileExplorer onFileSelect={handleFileSelect} />
                        </div>
                    </div>

                    {/* Vertical Resizer Handle (Mobile) */}
                    <div
                        className="h-1 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors z-10 w-full flex-shrink-0"
                        onMouseDown={startResizingVertical}
                    />

                    <div
                        className="flex flex-col overflow-hidden bg-white dark:bg-gray-800"
                        style={{ height: `${100 - topSectionHeight}%` }}
                    >
                        <ChatList onSelectChat={(chat) => {
                            setActiveChat(chat);
                            setIsLeftSidebarOpen(false);
                            setIsRightSidebarOpen(true);
                        }} />
                    </div>

                    <button
                        onClick={() => setIsLeftSidebarOpen(false)}
                        className="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full z-50"
                    >
                        ✕
                    </button>
                </div>

                {/* Middle Area - Canvas / Code Editor */}
                <div className="flex-1 flex flex-col relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    {/* View Toggle Button - Top Left Absolute */}
                    <div className="absolute top-4 left-4 z-10">
                        <button
                            onClick={() => setActiveView(activeView === 'canvas' ? 'editor' : 'canvas')}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 focus:outline-none transition-all duration-200"
                            title={activeView === 'canvas' ? "Switch to Code Editor" : "Switch to Canvas"}
                        >
                            {activeView === 'canvas' ? (
                                <PenTool className="w-5 h-5" />
                            ) : (
                                <Code className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Main Content Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <EditorCanvas view={activeView} fileContent={fileContent} />
                    </div>
                </div>

                {/* Right Sidebar - Desktop (Resizable) */}
                <div
                    className="hidden md:flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 relative transition-none"
                    style={{ width: rightSidebarWidth }}
                >
                    {/* Right Resizer Handle */}
                    <div
                        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50 opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-600"
                        onMouseDown={startResizingRight}
                    />
                    <Chat activeChat={activeChat} />
                </div>

                {/* Right Sidebar - Mobile (Drawer - Fixed Width) */}
                <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 md:hidden shadow-xl transform transition-transform duration-300 ease-in-out ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <Chat activeChat={activeChat} />
                    <button
                        onClick={() => setIsRightSidebarOpen(false)}
                        className="absolute top-2 left-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full"
                    >
                        ✕
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
