import React from 'react';
import Canvas from './canvas/Canvas';
import CodeEditor from './editor/CodeEditor';

const EditorCanvas = ({ view, fileContent, filePath, roomId, isHost, userName }) => {
    return (
        <div className="absolute inset-0 p-4">
            {view === 'canvas' ? (
                <Canvas roomId={roomId} isHost={isHost} userName={userName} />
            ) : (
                <CodeEditor fileContent={fileContent} filePath={filePath} />
            )}
        </div>
    );
};

export default EditorCanvas;
