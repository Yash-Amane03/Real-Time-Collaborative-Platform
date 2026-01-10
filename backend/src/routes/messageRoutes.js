const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all messages for a room
// @route   GET /api/messages/:roomId
// @access  Private
const Group = require('../models/Group');
const mongoose = require('mongoose');

// @desc    Get all messages for a room
// @route   GET /api/messages/:roomId
// @access  Private
router.get('/:roomId', protect, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id.toString();

        // 1. Access Control Logic
        if (roomId === 'general') {
            // Public room - Allow all
        }
        else if (roomId.includes('_')) {
            // Direct Message: Ensure user is one of the participants
            const participants = roomId.split('_');
            if (!participants.includes(userId)) {
                return res.status(403).json({ message: 'Not authorized to view this private chat' });
            }
        }
        else if (mongoose.Types.ObjectId.isValid(roomId)) {
            // Group Chat: Check membership
            const group = await Group.findById(roomId);
            if (group) {
                const isMember = group.members.some(id => id.toString() === userId);
                const isHost = group.host.toString() === userId;

                if (!isMember && !isHost) {
                    return res.status(403).json({ message: 'Not authorized to access this group' });
                }
            }
            // If group not found, we proceed (might return 0 messages or handle as 404 later, but fetch will just return empty)
        }
        else {
            // Unknown format
            // return res.status(400).json({ message: 'Invalid Room ID' });
        }

        // 2. Fetch Messages
        const populatedMessages = await Message.find({ roomId })
            .populate('sender', 'name email')
            .sort({ createdAt: 1 });

        const formattedMessages = populatedMessages.map(msg => ({
            _id: msg._id,
            roomId: msg.roomId,
            sender: msg.sender._id,
            senderName: msg.sender.name,
            content: msg.content,
            timestamp: msg.createdAt
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
