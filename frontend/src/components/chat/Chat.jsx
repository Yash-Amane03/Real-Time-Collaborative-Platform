import React, { useState, useEffect, useRef } from 'react';
import { Send, UserPlus, X, Search } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

const ENDPOINT = 'http://localhost:5000'; // Backend URL
let socket;

const Chat = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const messagesEndRef = useRef(null);
    const [roomId, setRoomId] = useState('general');
    const [socketConnected, setSocketConnected] = useState(false);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteSearch, setInviteSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Load user info
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            setUserInfo(JSON.parse(storedUser));
        }
    }, []);

    // Determine Room ID
    useEffect(() => {
        if (!userInfo || !activeChat) return;

        let newRoomId = 'general';
        if (activeChat.type === 'room') {
            newRoomId = activeChat.id;
        } else if (activeChat.type === 'group') {
            newRoomId = activeChat.id;
        } else if (activeChat.type === 'dm') {
            newRoomId = [userInfo._id, activeChat.id].sort().join('_');
        }
        setRoomId(newRoomId);
    }, [activeChat, userInfo]);

    // Socket Initialization & Event Listeners
    useEffect(() => {
        if (!socket) socket = io(ENDPOINT);
        setSocketConnected(true);

        const handleReceiveMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, []);

    // Room Management & History Fetch
    useEffect(() => {
        if (!socket || !roomId || !socketConnected) return;

        socket.emit('join_room', roomId);

        const fetchMessages = async () => {
            if (!userInfo) return;
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get(`http://localhost:5000/api/messages/${roomId}`, config);
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages", error);
                setMessages([]);
            }
        };
        fetchMessages();

        return () => {
            socket.emit('leave_room', roomId);
        };

    }, [roomId, userInfo, socketConnected]);



    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !userInfo) return;

        if (!socket) {
            console.warn("Socket disconnected, attempting reconnect...");
            socket = io(ENDPOINT);
        }

        const messageData = {
            roomId,
            sender: userInfo._id, // Backend needs Object ID
            senderName: userInfo.name, // For UI display
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        if (socket) {
            socket.emit('send_message', messageData);
            setMessages((list) => [...list, messageData]);
            setNewMessage('');
        } else {
            alert("Connection lost. Please try again.");
        }
    };

    // Search users for invite
    useEffect(() => {
        const searchUsers = async () => {
            if (!inviteSearch.trim()) {
                setSearchResults([]);
                return;
            }
            setInviteLoading(true);
            try {
                const config = {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                };
                const { data } = await axios.get(`http://localhost:5000/api/users?search=${inviteSearch}`, config);
                setSearchResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setInviteLoading(false);
            }
        };
        const timeoutId = setTimeout(() => {
            if (showInviteModal) searchUsers();
        }, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [inviteSearch, showInviteModal, userInfo]);

    const handleInviteUser = async (userId) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            };
            await axios.put(`http://localhost:5000/api/groups/${activeChat.id}/add`, { userId }, config);
            alert('User added to group!');
            setShowInviteModal(false);
            setInviteSearch('');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to add user');
        }
    };

    // Helper to format time
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between relative h-16">

                {/* Left Side: Badge or Type Indicator */}
                <div className="flex items-center w-auto md:w-1/3">
                    {activeChat?.type === 'group' && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                            GROUP
                        </span>
                    )}
                    {activeChat?.type === 'dm' && (
                        <span className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full font-medium">
                            DM
                        </span>
                    )}
                    {activeChat?.type === 'room' && (
                        <span className="text-[10px] bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded-full font-medium">
                            PUBLIC
                        </span>
                    )}
                </div>

                {/* Center: Title */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center w-1/3">
                    <h2 className="text-sm md:text-base font-bold text-gray-800 dark:text-white truncate max-w-full">
                        {activeChat?.name || 'Chat'}
                    </h2>
                    {/* Status text under title */}
                    {activeChat?.type === 'group' && activeChat.members && (
                        <span className="text-[10px] text-green-500 font-medium">
                            {activeChat.members.length} Online
                        </span>
                    )}
                </div>

                {/* Right Side: Members & Actions */}
                <div className="flex items-center justify-end w-auto md:w-1/3 space-x-2">



                    {/* Invite Button (Only for Host of Groups) */}
                    {activeChat?.type === 'group' && userInfo && activeChat.host === userInfo._id && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="Invite People"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800">
                {messages.map((msg, index) => {
                    const isMyMessage = userInfo && msg.sender === userInfo._id;
                    return (
                        <div key={index} className={`flex flex-col space-y-1 ${isMyMessage ? 'items-end' : 'items-start'}`}>
                            {!isMyMessage && (
                                <div className="flex items-center space-x-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-300`}>
                                        {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {msg.senderName}
                                        {activeChat?.type === 'group' && activeChat.host === msg.sender && (
                                            <span className="text-blue-600 dark:text-blue-400 text-[10px] ml-1">(Host)</span>
                                        )}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                                </div>
                            )}
                            <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm break-words ${isMyMessage
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                            {isMyMessage && <span className="text-xs text-gray-400">You • {formatTime(msg.timestamp)}</span>}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
            {/* Invite Modal */}
            {showInviteModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Invite to Group</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search users to invite..."
                                value={inviteSearch}
                                onChange={(e) => setInviteSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                            />
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {inviteLoading ? (
                                <p className="text-xs text-center text-gray-500">Searching...</p>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <button
                                        key={user._id}
                                        onClick={() => handleInviteUser(user._id)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300 mr-2">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate w-40">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                inviteSearch && <p className="text-xs text-center text-gray-500">No users found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
