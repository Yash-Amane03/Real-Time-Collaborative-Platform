const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createGroup, getGroups, addMember } = require('../controllers/groupController');

router.route('/').post(protect, createGroup).get(protect, getGroups);
router.route('/:groupId/add').put(protect, addMember);

module.exports = router;
