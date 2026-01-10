const Group = require('../models/Group');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const group = await Group.create({
            name,
            description,
            host: req.user._id,
            members: [req.user._id],
        });

        const fullGroup = await Group.findOne({ _id: group._id })
            .populate('members', '-password')
            .populate('host', '-password');

        res.status(201).json(fullGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: { $elemMatch: { $eq: req.user._id } } })
            .populate('members', '-password')
            .populate('host', '-password')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add member to group
// @route   PUT /api/groups/:groupId/add
// @access  Private (Host only)
const addMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const { groupId } = req.params;

        // Check if group exists
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if requester is host
        if (group.host.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only the host can add members' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'User already in group' });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                $push: { members: userId },
            },
            {
                new: true,
            }
        )
            .populate('members', '-password')
            .populate('host', '-password');

        res.json(updatedGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createGroup, getGroups, addMember };
