import React from 'react';
import { Send } from 'lucide-react';

const Chat = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Team Chat
                </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Mock Message - Received */}
                <div className="flex flex-col space-y-1 items-start">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
                            JD
                        </div>
                        <span className="text-xs text-gray-500">John Doe</span>
                        <span className="text-xs text-gray-400">10:30 AM</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg rounded-tl-none max-w-[85%] text-sm">
                        Hey, I just updated the main component. Check it out?
                    </div>
                </div>

                {/* Mock Message - Sent */}
                <div className="flex flex-col space-y-1 items-end">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg rounded-tr-none max-w-[85%] text-sm">
                        Sure, looking at it now.
                    </div>
                    <span className="text-xs text-gray-400">You • 10:32 AM</span>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                    <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
