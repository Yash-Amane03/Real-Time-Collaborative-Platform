const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        roomId: {
            type: String,
            default: 'general', // For now, single global room. Can be project ID later.
        },
    },
    {
        timestamps: true,
    }
);

// Expire messages after 30 days (30 * 24 * 60 * 60 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
