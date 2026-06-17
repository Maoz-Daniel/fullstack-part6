const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authenticateToken');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/users', adminController.listUsers);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);
router.put('/users/:id/make-admin', adminController.makeAdmin);
router.get('/actions', adminController.listUserActions);

module.exports = router;
