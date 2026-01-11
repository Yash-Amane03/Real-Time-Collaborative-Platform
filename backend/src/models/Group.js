const mongoose = require('mongoose');

const groupSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        drawingPermission: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
