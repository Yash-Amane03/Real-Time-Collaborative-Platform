const File = require('../models/File');

// @desc    Get all files for user
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res) => {
    try {
        const files = await File.find({ user: req.user._id });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a file or folder
// @route   POST /api/files
// @access  Private
const createFile = async (req, res) => {
    const { name, type, parentId, content } = req.body;

    try {
        const file = new File({
            user: req.user._id,
            name,
            type,
            parentId: parentId || null,
            content: content || '',
        });

        const createdFile = await file.save();
        res.status(201).json(createdFile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update file (rename, content, or move)
// @route   PUT /api/files/:id
// @access  Private
const updateFile = async (req, res) => {
    const { name, content, parentId } = req.body;

    try {
        const file = await File.findById(req.params.id);

        if (file) {
            if (file.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            file.name = name || file.name;
            file.content = content !== undefined ? content : file.content;
            if (parentId !== undefined) {
                file.parentId = parentId;
            }

            const updatedFile = await file.save();
            res.json(updatedFile);
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete file or folder
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (file) {
            if (file.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // If it's a folder, we might want to delete children too
            // For simplicity, let's just delete the item for now. 
            // A recursive delete would be better for folders.
            await file.deleteOne();

            // Delete children if it's a folder
            if (file.type === 'folder') {
                await File.deleteMany({ parentId: file._id });
            }

            res.json({ message: 'File removed' });
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFiles,
    createFile,
    updateFile,
    deleteFile,
};
