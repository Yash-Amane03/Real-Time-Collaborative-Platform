import React from 'react';

const CodeEditor = () => {
    return (
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center font-mono">
            <div className="text-center text-gray-400">
                <p className="text-lg font-medium">Code Editor View</p>
                <p className="text-sm">Write code here</p>
            </div>
        </div>
    );
};

export default CodeEditor;
