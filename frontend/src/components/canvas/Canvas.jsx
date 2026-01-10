import React from 'react';

const Canvas = () => {
    return (
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <div className="text-center text-gray-400">
                <p className="text-lg font-medium">Canvas View</p>
                <p className="text-sm">Draw and plan here</p>
            </div>
        </div>
    );
};

export default Canvas;
