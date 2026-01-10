const API_URL = 'http://localhost:5000/api/files';

const getAuthHeader = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }
    return { 'Content-Type': 'application/json' };
};

export const getFiles = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch files');
    return await response.json();
};

export const createFile = async (name, type, parentId = null, content = '') => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ name, type, parentId, content }),
    });
    if (!response.ok) throw new Error('Failed to create file');
    return await response.json();
};

export const updateFile = async (id, updates) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update file');
    return await response.json();
};

export const deleteFile = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete file');
    return await response.json();
};
