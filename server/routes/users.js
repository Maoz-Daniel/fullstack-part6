const express = require('express');
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', usersController.createUser);
router.put('/:id', authenticateToken, usersController.updateUser);
router.put('/:id/password', authenticateToken, usersController.changePassword);

module.exports = router;
