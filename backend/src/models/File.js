const mongoose = require('mongoose');

const fileSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['file', 'folder'],
            required: true,
        },
        content: {
            type: String,
            default: '',
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            default: null,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const File = mongoose.model('File', fileSchema);

module.exports = File;
