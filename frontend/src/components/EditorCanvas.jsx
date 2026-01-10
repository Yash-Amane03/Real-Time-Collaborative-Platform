import React from 'react';
import Canvas from './canvas/Canvas';
import CodeEditor from './editor/CodeEditor';

const EditorCanvas = ({ view }) => {
    return (
        <div className="absolute inset-0 p-4">
            {view === 'canvas' ? (
                <Canvas />
            ) : (
                <CodeEditor />
            )}
        </div>
    );
};

export default EditorCanvas;
