const express = require('express');
const router = express.Router();
const { registerUser, authUser, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.get('/', protect, getAllUsers);

module.exports = router;
