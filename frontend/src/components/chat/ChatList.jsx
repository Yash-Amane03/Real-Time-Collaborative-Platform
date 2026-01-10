import React, { useState, useEffect } from 'react';
import { Users, Hash, Search, Plus, X } from 'lucide-react';
import axios from 'axios';

const ChatList = ({ onSelectChat }) => {
    const [activeTab, setActiveTab] = useState('public'); // 'public' or 'private'
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Create Group State
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Hardcoded Public Channels
    const publicChannels = [
        { id: 'general', name: 'General' },
        { id: 'random', name: 'Random' },
        { id: 'announcements', name: 'Announcements' },
    ];

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (activeTab === 'private') {
                setLoading(true);
                try {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    const config = {
                        headers: { Authorization: `Bearer ${userInfo.token}` },
                    };

                    // Fetch Users
                    const usersRes = await axios.get(`http://localhost:5000/api/users?search=${search}`, config);
                    setUsers(usersRes.data);

                    // Fetch Groups
                    const groupsRes = await axios.get('http://localhost:5000/api/groups', config);
                    setGroups(groupsRes.data);

                } catch (error) {
                    console.error("Failed to fetch data", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [activeTab, search]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            };

            const { data } = await axios.post('http://localhost:5000/api/groups', { name: newGroupName }, config);
            setGroups([data, ...groups]);
            setNewGroupName('');
            setShowCreateGroup(false);
            onSelectChat({ type: 'group', id: data._id, name: data.name, host: data.host._id });
        } catch (error) {
            console.error(error);
            alert('Failed to create group');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Toggle Buttons */}
            <div className="flex p-2 gap-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('public')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'public'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <Hash className="w-4 h-4 mr-2" />
                    Public Chats
                </button>
                <button
                    onClick={() => setActiveTab('private')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'private'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Private Chats
                </button>
            </div>

            {/* Search (Only for Private/Users) */}
            {activeTab === 'private' && (
                <div className="p-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'public' ? (
                    <div className="p-2 space-y-1">
                        {publicChannels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChat({ type: 'room', id: channel.id, name: channel.name })}
                                className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Hash className="w-4 h-4 mr-3 text-gray-400" />
                                <span className="text-sm">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-2 space-y-4">
                        {loading && <div className="text-center py-2 text-xs text-gray-500">Loading...</div>}

                        {/* My Groups Section */}
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Groups</h3>
                                <button
                                    onClick={() => setShowCreateGroup(!showCreateGroup)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                                    title="Create Group"
                                >
                                    {showCreateGroup ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Create Group Form */}
                            {showCreateGroup && (
                                <form onSubmit={handleCreateGroup} className="px-2 mb-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Group Name"
                                            className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 focus:outline-none focus:border-blue-500"
                                            autoFocus
                                        />
                                        <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Add</button>
                                    </div>
                                </form>
                            )}

                            {/* Groups List */}
                            <div className="space-y-1">
                                {groups.map(group => (
                                    <button
                                        key={group._id}
                                        onClick={() => onSelectChat({
                                            type: 'group',
                                            id: group._id,
                                            name: group.name,
                                            host: group.host._id || group.host,
                                            members: group.members
                                        })}
                                        className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Users className="w-4 h-4 mr-3 text-blue-500" />
                                        <span className="text-sm truncate">{group.name}</span>
                                    </button>
                                ))}
                                {groups.length === 0 && !loading && (
                                    <div className="px-3 py-1 text-xs text-gray-400 italic">No groups yet</div>
                                )}
                            </div>
                        </div>

                        {/* Direct Messages Section */}
                        <div>
                            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h3>
                            <div className="space-y-1">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <button
                                            key={user._id}
                                            onClick={() => onSelectChat({ type: 'dm', id: user._id, name: user.name })}
                                            className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 mr-3">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    !loading && <div className="px-3 py-1 text-xs text-gray-400 italic">No users found</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
