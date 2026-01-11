import React from 'react';

const CodeEditor = ({ fileContent, filePath }) => {
    return (
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden font-mono">
            {/* File Path Header */}
            <div className="bg-gray-100 dark:bg-gray-900 px-4 pl-14 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <span className="font-semibold mr-2">File:</span>
                <span className="truncate">{filePath || 'No file selected'}</span>
            </div>

            {/* Editor Area */}
            <textarea
                className="flex-1 w-full h-full p-4 resize-none focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 text-sm leading-relaxed"
                value={fileContent}
                readOnly
                placeholder="// Select a file to view its content"
            />
        </div>
    );
};

export default CodeEditor;
