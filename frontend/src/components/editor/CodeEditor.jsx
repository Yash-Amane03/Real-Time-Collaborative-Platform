import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Terminal, X, ChevronUp, ChevronDown } from 'lucide-react';

const CodeEditor = ({ fileContent, filePath, theme = 'light', onChange }) => {
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isOutputVisible, setIsOutputVisible] = useState(true);
    const [outputWidth, setOutputWidth] = useState(400); // Default width in pixels
    const [outputHeight, setOutputHeight] = useState(200);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const containerRef = useRef(null);

    // Handle window resize for responsiveness
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine language based on file extension
    const getLanguage = (path) => {
        if (!path) return 'javascript';
        const ext = path.split('.').pop().toLowerCase();

        switch (ext) {
            case 'js': return 'javascript';
            case 'jsx': return 'javascript';
            case 'ts': return 'typescript';
            case 'tsx': return 'typescript';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'md': return 'markdown';
            case 'java': return 'java';
            case 'py': return 'python';
            case 'c': return 'c';
            case 'cpp': return 'cpp';
            case 'txt': return 'plaintext';
            default: return 'javascript';
        }
    };

    // Set initial size to 50% on mount
    useEffect(() => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            if (isMobile) {
                setOutputHeight(clientHeight / 2);
            } else {
                setOutputWidth(clientWidth / 2);
            }
        }
    }, [isMobile]); // Re-run if view mode changes

    // Extract filename from path
    const fileName = filePath ? filePath.split('/').pop() : 'Untitled';

    const runCode = async () => {
        if (!fileContent || !fileContent.trim()) {
            setOutput('Warning: The file is empty. Write some code to run!');
            setIsOutputVisible(true);
            return;
        }

        // Reset to 50% if not visible or just generally to ensure good view
        if (containerRef.current) {
            if (isMobile) {
                setOutputHeight(containerRef.current.clientHeight / 2);
            } else {
                setOutputWidth(containerRef.current.clientWidth / 2);
            }
        }
        setIsRunning(true);
        setIsOutputVisible(true);
        setOutput('Running...');

        const currentLanguage = getLanguage(filePath);
        // Map editor language to backend language
        const langMap = {
            'javascript': 'javascript',
            'typescript': 'javascript', // Run TS as JS (Node) for now
            'python': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
        };

        const backendLang = langMap[currentLanguage] || 'javascript';

        try {
            const response = await fetch('http://localhost:5000/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: backendLang,
                    code: fileContent,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setOutput(`Error: ${data.error}`);
            } else {
                setOutput(data.output || 'No output');
            }
        } catch (error) {
            setOutput(`Execution failed: ${error.message}\nMake sure the backend is running on port 5000.`);
        } finally {
            setIsRunning(false);
        }
    };

    // Resize Handlers
    const startResizing = (e) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsDragging(false);
    };

    const resize = React.useCallback((e) => {
        if (!isDragging || !containerRef.current) return;

        // Prevent default text selection behavior
        e.preventDefault();

        // Use requestAnimationFrame to throttle updates for smoother performance
        requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            if (isMobile) {
                // Resize Height (Bottom Panel)
                // Height = Container Bottom - Mouse Y
                // Mouse Y is relative to viewport, same as containerRect.bottom
                const newHeight = containerRect.bottom - e.clientY;

                // Constrain constraints: Min 50px, Max 80% of container
                if (newHeight > 50 && newHeight < containerRect.height * 0.8) {
                    setOutputHeight(newHeight);
                }
            } else {
                // Resize Width (Right Panel)
                // Width = Container Right - Mouse X
                const newWidth = containerRect.right - e.clientX;

                // Constraints: Min 200px, Max 80% of container
                if (newWidth > 200 && newWidth < containerRect.width * 0.8) {
                    setOutputWidth(newWidth);
                }
            }
        });
    }, [isDragging, isMobile]);

    // Attach global listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            window.addEventListener('touchmove', (e) => resize(e.touches[0]));
            window.addEventListener('touchend', stopResizing);

            // Global cursor style
            document.body.style.cursor = isMobile ? 'ns-resize' : 'ew-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);

            // Reset global cursor
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, resize, isMobile]);

    return (
        <div ref={containerRef} className={`flex flex-col h-full w-full bg-white border-l border-gray-200 ${isDragging ? 'select-none' : ''}`}>
            {/* Tab Bar / Header */}
            <div className="flex h-9 bg-gray-100 border-b border-gray-200 justify-between items-end px-2 sm:px-0 overflow-x-auto shrink-0">
                {/* Active Tab */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white border-t-2 border-t-blue-500 border-r border-gray-200 text-sm min-w-[120px] shadow-sm">
                    {/* File Icon */}
                    <span className="text-blue-500 text-xs font-mono">JS</span>
                    <span className="text-gray-700 truncate flex-1">{fileName}</span>
                    <button className="hover:bg-gray-200 rounded p-0.5 text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Run Button */}
                <div className="flex items-center gap-2 px-2 pb-1">
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        Run
                    </button>
                    <button
                        onClick={() => setIsOutputVisible(!isOutputVisible)}
                        className={`p-1 rounded hover:bg-gray-200 text-gray-600 ${isOutputVisible ? 'bg-gray-200' : ''}`}
                        title="Toggle Output"
                    >
                        <Terminal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor Body: Responsive Flex Container */}
            <div className={`flex-1 w-full relative flex ${isMobile ? 'flex-col' : 'flex-row'} min-h-0 overflow-hidden`}>
                <div className={`flex-1 relative h-full ${isDragging ? 'pointer-events-none' : ''}`}>
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        language={getLanguage(filePath)}
                        value={fileContent}
                        theme={theme}
                        onChange={(value) => onChange?.(value)}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            wordWrap: 'on',
                            automaticLayout: true,
                            padTabs: true,
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'all',
                        }}
                    />
                </div>

                {/* Output Panel */}
                {isOutputVisible && (
                    <div
                        className={`flex flex-col bg-gray-50 relative z-20 shadow-xl ${isMobile ? 'border-t-4 border-gray-300' : 'border-l-4 border-gray-300'}`}
                        style={{
                            width: isMobile ? '100%' : `${outputWidth}px`,
                            height: isMobile ? `${outputHeight}px` : '100%',
                            minWidth: isMobile ? '100%' : '200px',
                            minHeight: isMobile ? '150px' : '100%',
                            maxWidth: isMobile ? '100%' : '80%',
                            maxHeight: isMobile ? '80%' : '100%',
                            transition: isDragging ? 'none' : '0.2s ease',
                            flexShrink: 0, // Prevent crushing
                            willChange: 'width, height' // Optimize rendering
                        }}
                    >
                        {/* Resize Handle */}
                        <div
                            className={`absolute z-30 group flex justify-center items-center cursor-move
                                ${isMobile
                                    ? 'top-0 left-0 right-0 h-4 -mt-2 cursor-ns-resize' // Mobile: Bigger Top Handle
                                    : 'top-0 left-0 bottom-0 w-4 -ml-2 cursor-ew-resize' // Desktop: Bigger Left Handle
                                }`}
                            onMouseDown={startResizing}
                            onTouchStart={startResizing}
                        >
                            <div className={`bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors
                                 ${isDragging ? 'bg-blue-500' : ''}
                                 ${isMobile ? 'w-12 h-1.5' : 'h-12 w-1.5'}`}
                            />
                        </div>

                        <div className={`flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 select-none shrink-0`}>
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs font-semibold text-gray-600 uppercase">Output</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setOutput('')} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200">Clear</button>
                                <button onClick={() => setIsOutputVisible(false)} className="text-gray-500 hover:text-gray-700 p-0.5 rounded hover:bg-gray-200"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div className="flex-1 p-3 overflow-auto font-mono text-sm text-gray-800 whitespace-pre-wrap select-text bg-white">
                            {output || <span className="text-gray-400 italic">No output to display. Click 'Run' to execute code.</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;
