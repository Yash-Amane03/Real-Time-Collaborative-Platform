import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Pencil, Square, Circle, Minus, Undo, Redo2 as Redo, Trash2, Eraser, Hand, ZoomIn, ZoomOut, Type, MousePointer2, Menu, Lock, Unlock } from 'lucide-react';
import { io } from 'socket.io-client';

const Canvas = ({ roomId, isHost, userName }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    // Canvas State
    const [elements, setElements] = useState([]);
    const [action, setAction] = useState('none'); // 'drawing', 'moving', 'panning', 'writing', 'none'
    const [tool, setTool] = useState('pencil'); // pencil, line, rectangle, circle, eraser, hand, text, selection
    const [selectedElement, setSelectedElement] = useState(null);
    const [history, setHistory] = useState([]); // For Redo functionality
    const [remoteCursors, setRemoteCursors] = useState({}); // { userId: { x, y, userName } }
    const [canDraw, setCanDraw] = useState(true); // Permission state

    // Viewport State (Infinite Canvas)
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // UI State
    // Toolbar is always open in new design

    // Text Input State
    const [textInput, setTextInput] = useState(null); // { x, y, text }

    // Optimization Refs
    const currentElementRef = useRef(null);

    // Initial render and resize handler
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            renderCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        const observer = new ResizeObserver(() => resizeCanvas());
        if (container) observer.observe(container);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            observer.disconnect();
        };
    }, [elements, offset, scale, selectedElement, textInput]);

    // Re-render trigger
    useLayoutEffect(() => {
        renderCanvas();
    }, [elements, offset, scale, selectedElement, textInput]);

    // Socket.io Connection
    useEffect(() => {
        if (!roomId) return;

        // Connect to backend
        socketRef.current = io('http://localhost:5000');

        const socket = socketRef.current;

        socket.emit('join_room', roomId);

        socket.on('canvas_update', (data) => {
            // data: { element, action }
            if (data.action === 'add') {
                setElements(prev => [...prev, data.element]);
            } else if (data.action === 'update') {
                setElements(prev => prev.map(el => el.id === data.element.id ? data.element : el));
            } else if (data.action === 'delete') {
                // Handle delete if implemented
            }
        });

        socket.on('cursor_move', (data) => {
            setRemoteCursors(prev => ({
                ...prev,
                [data.userId]: { x: data.x, y: data.y, userName: data.userName }
            }));
        });

        socket.on('canvas_action', (data) => {
            if (data.action === 'undo') {
                setElements(prev => {
                    const newElements = [...prev];
                    newElements.pop();
                    return newElements;
                });
            } else if (data.action === 'redo') {
                // Redo is tricky without shared history state, but we try best effort or skip
                // For a robust implementation, backend should hold state. 
                // Here we just acknowledge the command.
            } else if (data.action === 'clear') {
                setElements([]);
                setHistory([]);
            }
        });

        socket.on('permission_update', (data) => {
            setCanDraw(data.canDraw);
            if (!data.canDraw && !isHost) {
                setTool('selection'); // Force tool switch
            }
        });

        socket.on('user_left', (data) => {
            setRemoteCursors(prev => {
                const newCursors = { ...prev };
                delete newCursors[data.userId];
                return newCursors;
            });
        });

        return () => {
            socket.off('canvas_update');
            socket.off('cursor_move');
            socket.off('canvas_action');
            socket.off('permission_update');
            socket.off('user_left');
            socket.disconnect();
        };
    }, [roomId, isHost]);

    // Commit text if tool changes
    useEffect(() => {
        if (tool !== 'text' && textInput) {
            handleTextComplete();
        }
    }, [tool]);

    // --- Helper Functions ---

    const screenToWorld = (screenX, screenY) => {
        return {
            x: (screenX - offset.x) / scale,
            y: (screenY - offset.y) / scale
        };
    };

    const getMouseCoordinates = (e) => {
        const { clientX, clientY } = e;
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const isWithinElement = (x, y, element) => {
        if (!element) return false;
        const { type, x1, x2, y1, y2, points } = element;

        switch (type) {
            case 'rectangle':
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
            case 'circle':
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const distance = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
                return distance <= radius;
            case 'line':
                const a = { x: x1, y: y1 };
                const b = { x: x2, y: y2 };
                const c = { x, y };
                const offset = distance(a, b) - (distance(a, c) + distance(b, c));
                return Math.abs(offset) < 1;
            case 'pencil':
            case 'eraser':
                const xs = points.map(p => p.x);
                const ys = points.map(p => p.y);
                return x >= Math.min(...xs) - 5 && x <= Math.max(...xs) + 5 &&
                    y >= Math.min(...ys) - 5 && y <= Math.max(...ys) + 5;
            case 'text':
                const textW = element.text.length * 15;
                return x >= x1 && x <= x1 + textW && y >= y1 - 24 && y <= y1 + 5;
            default:
                return false;
        }
    };

    const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    const getElementAtPosition = (x, y, elements) => {
        return elements.slice().reverse().find(element => isWithinElement(x, y, element));
    };

    // --- Rendering ---

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        drawGrid(ctx, width, height, scale, offset);

        elements.forEach(element => {
            if (element) drawElement(ctx, element);
        });

        if (currentElementRef.current) {
            drawElement(ctx, currentElementRef.current);
        }

        // Highlight selection
        if (selectedElement) {
            const bounds = getElementBounds(selectedElement);
            if (bounds) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1 / scale;
                ctx.setLineDash([5 / scale, 5 / scale]);
                ctx.strokeRect(bounds.x - 5 / scale, bounds.y - 5 / scale, bounds.w + 10 / scale, bounds.h + 10 / scale);
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    };

    const getElementBounds = (element) => {
        if (!element) return null;
        const { type, x1, y1, x2, y2, points } = element;
        if (type === 'rectangle' || type === 'line') {
            return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
        }
        if (type === 'circle') {
            const r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            return { x: x1 - r, y: y1 - r, w: r * 2, h: r * 2 };
        }
        if (type === 'text') {
            return { x: x1, y: y1 - 24, w: element.text.length * 15, h: 30 };
        }
        if (type === 'pencil' || type === 'eraser') {
            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
        }
        return null;
    };

    const drawGrid = (ctx, width, height, scale, offset) => {
        const gap = 20;
        const dotRadius = 1 / scale;

        const startX = Math.floor((-offset.x / scale) / gap) * gap;
        const endX = Math.floor(((-offset.x + width) / scale) / gap) * gap + gap;
        const startY = Math.floor((-offset.y / scale) / gap) * gap;
        const endY = Math.floor(((-offset.y + height) / scale) / gap) * gap + gap;

        ctx.fillStyle = '#e5e7eb';

        for (let x = startX; x <= endX; x += gap) {
            for (let y = startY; y <= endY; y += gap) {
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawElement = (ctx, element) => {
        if (!element) return;
        const { type, x1, y1, x2, y2, points, text } = element;
        const strokeColor = element.stroke || '#000';

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = type === 'eraser' ? 20 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = strokeColor;

        ctx.beginPath();

        if (type === 'pencil' || type === 'eraser') {
            ctx.strokeStyle = type === 'eraser' ? '#ffffff' : strokeColor;
            if (points && points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y);
                points.forEach(point => ctx.lineTo(point.x, point.y));
            }
            ctx.stroke();
        } else if (type === 'line') {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else if (type === 'rectangle') {
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.stroke();
        } else if (type === 'circle') {
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (type === 'text') {
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#000'; // Always black for now, or match stroke
            ctx.fillText(text, x1, y1);
        }
    };

    // --- Interaction Handlers ---

    const handleToolSelect = (selectedTool) => {
        if (!canDraw && !isHost && ['pencil', 'rectangle', 'circle', 'line', 'text', 'eraser'].includes(selectedTool)) {
            alert("Host has disabled drawing.");
            return;
        }
        setTool(selectedTool);
        setSelectedElement(null);
        setAction('none');
    };

    const handleMouseDown = (e) => {
        if (!canDraw && !isHost && tool !== 'hand' && tool !== 'selection') return;

        const { x: screenX, y: screenY } = getMouseCoordinates(e);
        const { x, y } = screenToWorld(screenX, screenY);

        if (tool === 'hand' || e.buttons === 4 || e.button === 1) {
            setAction('panning');
            setPanStart({ x: screenX, y: screenY });
            return;
        }

        if (tool === 'text') {
            if (textInput) {
                handleTextComplete();
                return;
            }
            setTextInput({ x, y, text: '' });
            setAction('writing');
            setTimeout(() => textareaRef.current?.focus(), 10);
            return;
        }

        if (tool === 'selection') {
            const element = getElementAtPosition(x, y, elements);
            if (element) {
                setSelectedElement(element);
                setAction('moving');
                if (element.type === 'pencil' || element.type === 'eraser') {
                    setPanStart({ x, y });
                } else {
                    setPanStart({ x: x - element.x1, y: y - element.y1 });
                }
            } else {
                setSelectedElement(null);
            }
            return;
        }

        setAction('drawing');
        const id = Date.now();

        if (tool === 'pencil' || tool === 'eraser') {
            currentElementRef.current = {
                id,
                type: tool,
                points: [{ x, y }],
                stroke: tool === 'eraser' ? '#fff' : '#000'
            };
        } else {
            currentElementRef.current = {
                id,
                type: tool,
                x1: x, y1: y, x2: x, y2: y,
                stroke: '#000'
            };
        }
        renderCanvas();
    };

    const handleMouseMove = (e) => {
        const { x: screenX, y: screenY } = getMouseCoordinates(e);
        const { x, y } = screenToWorld(screenX, screenY);

        if (action === 'panning') {
            const dx = screenX - panStart.x;
            const dy = screenY - panStart.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: screenX, y: screenY });
            return;
        }

        // Emit cursor move
        if (socketRef.current && roomId) {
            // Throttle this in production
            socketRef.current.emit('cursor_move', {
                roomId,
                userId: socketRef.current.id,
                userName: userName || 'User',
                x, y
            });
        }

        if (action === 'moving' && selectedElement) {
            if (selectedElement.type === 'pencil' || selectedElement.type === 'eraser') {
                const deltaX = x - panStart.x;
                const deltaY = y - panStart.y;
                const newPoints = selectedElement.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
                setElements(prev => prev.map(el => (el && el.id === selectedElement.id) ? { ...el, points: newPoints } : el));
                setSelectedElement(prev => ({ ...prev, points: newPoints }));
                setPanStart({ x, y });
            } else {
                const w = selectedElement.x2 - selectedElement.x1;
                const h = selectedElement.y2 - selectedElement.y1;
                const newX1 = x - panStart.x;
                const newY1 = y - panStart.y;
                const updatedEl = { ...selectedElement, x1: newX1, y1: newY1, x2: newX1 + w, y2: newY1 + h };
                setElements(prev => prev.map(el => (el && el.id === selectedElement.id) ? updatedEl : el));
                setSelectedElement(updatedEl);
            }
            return;
        }

        if (action === 'drawing' && currentElementRef.current) {
            const current = currentElementRef.current;
            if (current.type === 'pencil' || current.type === 'eraser') {
                current.points.push({ x, y });
            } else {
                current.x2 = x;
                current.y2 = y;
            }
            renderCanvas();
        }
    };

    const handleMouseUp = () => {
        if (action === 'drawing' && currentElementRef.current) {
            const newElement = currentElementRef.current;
            setElements(prev => [...prev, newElement]);

            // Emit new element
            if (socketRef.current) {
                socketRef.current.emit('canvas_update', {
                    roomId,
                    element: newElement,
                    action: 'add'
                });
            }

            currentElementRef.current = null;
        }
        if (action === 'writing') return;

        // Clear redo history when a new action is performed
        if (action === 'drawing' && currentElementRef.current) {
            setHistory([]);
        }
        setAction('none');
    };

    const handleTextComplete = () => {
        setTextInput(current => {
            if (!current || !current.text.trim()) {
                setAction('none');
                return null;
            }
            const newElement = {
                id: Date.now(),
                type: 'text',
                x1: current.x,
                y1: current.y,
                text: current.text,
                stroke: '#000'
            };
            setElements(prev => [...prev, newElement]);

            // Emit new element
            if (socketRef.current) {
                socketRef.current.emit('canvas_update', {
                    roomId,
                    element: newElement,
                    action: 'add'
                });
            }

            setHistory([]); // Clear redo history on text add
            setAction('none');
            return null;
        });
    };

    const zoom = (delta) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const worldPosBefore = screenToWorld(centerX, centerY);
        const newScale = Math.min(Math.max(scale + delta, 0.1), 5);
        const newOffset = { x: centerX - worldPosBefore.x * newScale, y: centerY - worldPosBefore.y * newScale };
        setScale(newScale);
        setOffset(newOffset);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const { x: screenX, y: screenY } = getMouseCoordinates(e);
        const worldPosBefore = screenToWorld(screenX, screenY);
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(scale + delta, 0.1), 5);
        const newOffset = { x: screenX - worldPosBefore.x * newScale, y: screenY - worldPosBefore.y * newScale };
        setScale(newScale);
        setOffset(newOffset);
    };

    const undo = () => {
        setElements(prev => {
            if (prev.length === 0) return prev;
            const newElements = [...prev];
            const removed = newElements.pop();
            setHistory(prevHistory => [...prevHistory, removed]);

            if (socketRef.current) socketRef.current.emit('canvas_action', { roomId, action: 'undo' });
            return newElements;
        });
    };

    const redo = () => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const newHistory = [...prev];
            const restored = newHistory.pop();
            setElements(prevElements => [...prevElements, restored]);

            if (socketRef.current) socketRef.current.emit('canvas_action', { roomId, action: 'redo' });
            return newHistory;
        });
    };

    const clearCanvas = () => {
        if (confirm("Clear?")) {
            setElements([]);
            setHistory([]);
            if (socketRef.current) socketRef.current.emit('canvas_action', { roomId, action: 'clear' });
        }
    };

    const togglePermission = () => {
        if (!isHost) return;
        const newPermission = !canDraw;
        setCanDraw(newPermission);
        if (socketRef.current) {
            socketRef.current.emit('toggle_permission', { roomId, canDraw: newPermission });
        }
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-gray-50" ref={containerRef}>

            <canvas
                ref={canvasRef}
                className={`block touch-none w-full h-full ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : tool === 'text' ? 'cursor-text' : tool === 'selection' ? 'cursor-default' : 'cursor-crosshair'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            />

            {/* Hidden Text Input (Visible only when typing) */}
            {textInput && (
                <textarea
                    ref={textareaRef}
                    className="absolute bg-transparent outline-none resize-none overflow-hidden text-black font-sans z-50 p-0 m-0 leading-none caret-blue-500"
                    style={{
                        left: `${textInput.x * scale + offset.x}px`,
                        top: `${textInput.y * scale + offset.y}px`,
                        fontSize: `${24 * scale}px`,
                        width: `${Math.max(100, textInput.text.length * 15 * scale)}px`,
                        minWidth: '50px',
                        height: 'auto'
                    }}
                    value={textInput.text}
                    onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTextComplete();
                        }
                    }}
                    autoFocus
                />
            )}



            {/* Remote Cursors */}
            {Object.entries(remoteCursors).map(([userId, cursor]) => (
                <div
                    key={userId}
                    className="absolute pointer-events-none z-40 flex flex-col items-center"
                    style={{
                        left: `${cursor.x * scale + offset.x}px`,
                        top: `${cursor.y * scale + offset.y}px`,
                        transition: 'all 0.1s linear'
                    }}
                >
                    <MousePointer2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                    <span className="bg-blue-500 text-white text-[10px] px-1 rounded mt-1 opacity-75">
                        {cursor.userName || 'User'}
                    </span>
                </div>
            ))}

            {/* Bottom Toolbar */}
            <div className="absolute bottom-0 left-0 w-full h-auto min-h-[72px] bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-2 md:py-0 z-50 gap-2 md:gap-0">

                {/* Left Section: Zoom & History */}
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 order-2 md:order-1">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200/60">
                        <button onClick={() => zoom(-0.1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all" title="Zoom Out">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 w-12 text-center select-none font-mono hidden sm:block">
                            {Math.round(scale * 100)}%
                        </span>
                        <button onClick={() => zoom(0.1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all" title="Zoom In">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

                    {/* History */}
                    <div className="flex items-center gap-1">
                        <ToolButton icon={Undo} onClick={undo} tooltip="Undo" />
                        <ToolButton icon={Redo} onClick={redo} tooltip="Redo" />
                    </div>

                    {isHost && (
                        <div className="flex items-center gap-1 ml-4 border-l border-gray-200 pl-4">
                            <ToolButton
                                icon={canDraw ? Unlock : Lock}
                                onClick={togglePermission}
                                tooltip={canDraw ? "Lock Drawing" : "Unlock Drawing"}
                                active={!canDraw}
                                danger={!canDraw}
                            />
                        </div>
                    )}

                    {/* Mobile Clear Button (To save space on right) */}
                    <div className="md:hidden ml-auto">
                        <button
                            onClick={clearCanvas}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Clear Canvas"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Center Section: Tools */}
                <div className="relative md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-2 w-full md:w-auto flex justify-center">
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl shadow-lg border border-gray-100 overflow-x-auto max-w-full">
                        <div className="flex items-center gap-0.5 px-1 shrink-0">
                            <ToolButton icon={MousePointer2} active={tool === 'selection'} onClick={() => handleToolSelect('selection')} tooltip="Select (V)" />
                            <ToolButton icon={Hand} active={tool === 'hand'} onClick={() => handleToolSelect('hand')} tooltip="Pan (Space)" />
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>

                        <div className="flex items-center gap-0.5 px-1 shrink-0">
                            <ToolButton icon={Pencil} active={tool === 'pencil'} onClick={() => handleToolSelect('pencil')} tooltip="Pencil" />
                            <ToolButton icon={Eraser} active={tool === 'eraser'} onClick={() => handleToolSelect('eraser')} tooltip="Eraser" />
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>

                        <div className="flex items-center gap-0.5 px-1 shrink-0">
                            <ToolButton icon={Square} active={tool === 'rectangle'} onClick={() => handleToolSelect('rectangle')} tooltip="Rectangle" />
                            <ToolButton icon={Circle} active={tool === 'circle'} onClick={() => handleToolSelect('circle')} tooltip="Circle" />
                            <ToolButton icon={Minus} active={tool === 'line'} onClick={() => handleToolSelect('line')} tooltip="Line" />
                            <ToolButton icon={Type} active={tool === 'text'} onClick={() => handleToolSelect('text')} tooltip="Text" />
                        </div>
                    </div>
                </div>

                {/* Right Section: Actions - Desktop Only (Mobile has it in left/top row) */}
                <div className="hidden md:flex items-center gap-3 order-3">
                    <button
                        onClick={clearCanvas}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Clear Canvas"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToolButton = ({ icon: Icon, active, onClick, danger, tooltip }) => (
    <button
        onClick={onClick}
        title={tooltip}
        className={`group relative p-2 rounded-lg transition-all duration-200 flex items-center justify-center
            ${active
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }
            ${danger ? 'hover:bg-red-50 hover:text-red-500' : ''}
        `}
    >
        <Icon className={`w-5 h-5 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />

        {/* Tooltip */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
            {tooltip}
            <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
        </span>
    </button>
);

export default Canvas;
