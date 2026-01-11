import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, Trash2, FilePlus, FolderPlus, FileCode, FileJson, FileType, Globe, AlignLeft, Image } from 'lucide-react';
import { getFiles, createFile, deleteFile, updateFile } from '../../services/fileService';

const getFileIcon = (name) => {
    if (!name) return <File className="w-4 h-4 mr-2 text-gray-400" />;
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return <FileCode className="w-4 h-4 mr-2 text-yellow-500" />;
        case 'css':
        case 'scss':
            return <FileType className="w-4 h-4 mr-2 text-blue-400" />;
        case 'html':
            return <Globe className="w-4 h-4 mr-2 text-orange-500" />;
        case 'json':
            return <FileJson className="w-4 h-4 mr-2 text-green-500" />;
        case 'md':
        case 'txt':
            return <AlignLeft className="w-4 h-4 mr-2 text-gray-500" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'svg':
            return <Image className="w-4 h-4 mr-2 text-purple-500" />;
        case 'java':
            return <FileCode className="w-4 h-4 mr-2 text-red-500" />;
        case 'py':
            return <FileCode className="w-4 h-4 mr-2 text-blue-500" />;
        case 'c':
        case 'cpp':
            return <FileCode className="w-4 h-4 mr-2 text-blue-600" />;
        default:
            return <File className="w-4 h-4 mr-2 text-gray-400" />;
    }
};

const FileItem = ({ item, level, onSelect, onDelete, onExpand, expandedIds, onMove, allFiles }) => {
    const isExpanded = expandedIds.includes(item._id);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e) => {
        e.dataTransfer.setData('fileId', item._id);
        e.stopPropagation();
    };

    const handleDragOver = (e) => {
        if (item.type === 'folder') {
            e.preventDefault(); // Allow drop
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const draggedFileId = e.dataTransfer.getData('fileId');

        // Prevent dropping on itself
        if (draggedFileId === item._id) return;

        // Prevent cycling (dropping a folder into its own descendant)
        // Simple check: get all descendants of draggedId and ensure targetId is not one of them
        // For now, simpler check: if dragged is folder, ensure target is separate logic or assume backend checks.
        // Let's rely on onMove to handle validation if complex, or quick check here.
        // We need 'allFiles' to check descendants properly if we want to be strict frontend side.
        // For this iteration, let's pass to onMove.

        onMove(draggedFileId, item._id);
    };

    return (
        <div style={{ paddingLeft: `${level * 12}px` }}>
            <div
                draggable="true"
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group flex items-center px-2 py-1.5 text-sm rounded cursor-pointer transition-colors border-l-2 ${isDragOver
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500' // Visual Feedback like VS Code focus
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } `}
                onClick={() => item.type === 'folder' ? onExpand(item._id) : onSelect(item)}
            >
                {item.type === 'folder' && (
                    <span className="mr-1 text-gray-400">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                )}
                {item.type === 'folder' ? (
                    <Folder className={`w-4 h-4 mr-2 ${isDragOver ? 'text-blue-600' : 'text-blue-500'} `} />
                ) : (
                    getFileIcon(item.name)
                )}
                <span className="flex-1 truncate">{item.name}</span>

                {/* Delete Button - Visible on Hover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item._id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    title="Delete"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            {item.type === 'folder' && isExpanded && item.children && (
                <div>
                    {item.children.map(child => (
                        <FileItem
                            key={child._id}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onExpand={onExpand}
                            expandedIds={expandedIds}
                            onMove={onMove}
                            allFiles={allFiles}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer = ({ onFileSelect }) => {
    const [files, setFiles] = useState([]);
    const [allFilesRaw, setAllFilesRaw] = useState([]); // Store raw flat list for helpers

    const getPath = (file) => {
        let path = file.name;
        let current = file;
        while (current.parentId) {
            const parent = allFilesRaw.find(f => f._id === current.parentId);
            if (parent) {
                path = `${parent.name}/${path}`;
                current = parent;
            } else {
                break;
            }
        }
        return path;
    };

    const handleFileSelectInternal = (file) => {
        const path = getPath(file);
        onFileSelect(file, path);
    };
    const [expandedIds, setExpandedIds] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState(null); // 'file' or 'folder' or null
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [creationError, setCreationError] = useState('');

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const data = await getFiles();
            setAllFilesRaw(data);
            setFiles(buildTree(data));
        } catch (error) {
            console.error('Failed to load files', error);
        }
    };

    const buildTree = (data) => {
        // Deep copy to avoid mutating cache if we used one, though here data is fresh
        const map = {};
        data.forEach(item => map[item._id] = { ...item, children: [] });
        const tree = [];
        data.forEach(item => {
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children.push(map[item._id]);
            } else {
                tree.push(map[item._id]);
            }
        });
        return tree;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreationError(''); // Reset error on new attempt
        if (!newItemName) {
            setIsCreating(null);
            return;
        }

        // Extension Validation
        if (isCreating === 'file') {
            const allowedExtensions = ['java', 'py', 'c', 'cpp', 'txt'];
            const ext = newItemName.split('.').pop().toLowerCase();

            if (!newItemName.includes('.') || !allowedExtensions.includes(ext)) {
                setCreationError('Allowed extensions: .java, .py, .c, .cpp, .txt');
                return;
            }
        }

        try {
            await createFile(newItemName, isCreating);
            setNewItemName('');
            setIsCreating(null);
            loadFiles(); // Refresh list
        } catch (error) {
            console.error('Failed to create item', error);
            setCreationError(`Failed to create: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteFile(id);
                loadFiles();
            } catch (error) {
                console.error('Failed to delete item', error);
            }
        }
    };

    const checkIsDescendant = (fileId, targetFolderId) => {
        if (!targetFolderId) return false; // Moving to root is always safe regarding descendancy

        let current = allFilesRaw.find(f => f._id === targetFolderId);
        while (current && current.parentId) {
            if (current.parentId === fileId) return true; // Found dragged file as an ancestor of target
            current = allFilesRaw.find(f => f._id === current.parentId);
        }
        return false;
    };

    const handleMove = async (fileId, targetFolderId) => {
        // Validation: Don't move folder into its own child
        if (fileId === targetFolderId) return;

        if (checkIsDescendant(fileId, targetFolderId)) {
            alert("Cannot move a folder into its own child.");
            return;
        }

        try {
            // If targetFolderId is null, we are moving to root. 
            // Our backend expects parentId in body. If null is passed, it sets to null.
            await updateFile(fileId, { parentId: targetFolderId || null });
            loadFiles();

            // Expand target if it's a folder (and not root)
            if (targetFolderId && !expandedIds.includes(targetFolderId)) {
                setExpandedIds(prev => [...prev, targetFolderId]);
            }
        } catch (error) {
            console.error('Failed to move file', error);
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Root Drop Handlers
    const handleRootDragOver = (e) => {
        e.preventDefault();
        setIsRootDragOver(true);
    };

    const handleRootDragLeave = (e) => {
        // Only disable if we are leaving the container, not entering a child
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsRootDragOver(false);
    };

    // We actually want dragging over the EMPTY SPACE to trigger root drop, 
    // but bubbling from children might trigger it too. 
    // Strategy: The container handles drop only if target is the container or we explicitly want to support bubbling drops to root if not handled by children.
    // Actually simplicity: If we drop on a folder, that folder handles it (e.stopPropagation). 
    // If we drop on the main div, it means we missed a folder aka Root.
    const handleRootDrop = (e) => {
        e.preventDefault();
        setIsRootDragOver(false);
        const draggedFileId = e.dataTransfer.getData('fileId');
        if (draggedFileId) {
            handleMove(draggedFileId, null); // Move to root
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 z-10 bg-white dark:bg-gray-800">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Explorer
                </h2>
                <div className="flex space-x-1">
                    <button
                        onClick={() => { setIsCreating('file'); setCreationError(''); setNewItemName(''); }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="New File"
                    >
                        <FilePlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setIsCreating('folder'); setCreationError(''); setNewItemName(''); }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="New Folder"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div
                className={`flex-1 overflow-y-auto p-2 transition-colors ${isRootDragOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''} `}
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
            >
                {/* Creation Input */}
                {isCreating && (
                    <div className="mb-2">
                        <form onSubmit={handleCreate} className={`px-2 py-2 bg-gray-50 dark:bg-gray-900 rounded border ${creationError ? 'border-red-500' : 'border-blue-200 dark:border-blue-900'}`}>
                            <input
                                autoFocus
                                type="text"
                                placeholder={`Enter ${isCreating} name...`}
                                value={newItemName}
                                onChange={(e) => { setNewItemName(e.target.value); setCreationError(''); }}
                                onBlur={() => !newItemName && setIsCreating(null)}
                                className="w-full bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-200"
                            />
                        </form>
                        {creationError && (
                            <div className="px-2 text-xs text-red-500 mt-1">
                                {creationError}
                            </div>
                        )}
                    </div>
                )}

                {/* File Tree */}
                <div className="space-y-0.5">
                    {files.map(item => (
                        <FileItem
                            key={item._id}
                            item={item}
                            level={0}
                            onSelect={handleFileSelectInternal}
                            onDelete={handleDelete}
                            onExpand={toggleExpand}
                            expandedIds={expandedIds}
                            onMove={handleMove}
                            allFiles={allFilesRaw}
                        />
                    ))}
                    {files.length === 0 && !isCreating && (
                        <div className="text-center text-xs text-gray-400 italic mt-4 pointer-events-none">
                            Drag files here or create new...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;
