const express = require('express');
const commentsController = require('../controllers/commentsController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/', commentsController.listComments);
router.get('/:id', commentsController.getComment);
router.post('/', authenticateToken, commentsController.createComment);
router.put('/:id', authenticateToken, commentsController.updateComment);
router.delete('/:id', authenticateToken, commentsController.deleteComment);

module.exports = router;
