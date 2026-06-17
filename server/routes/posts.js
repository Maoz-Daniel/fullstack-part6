const express = require('express');
const postsController = require('../controllers/postsController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/', postsController.listPosts);
router.get('/:id', postsController.getPost);
router.post('/', authenticateToken, postsController.createPost);
router.put('/:id', authenticateToken, postsController.updatePost);
router.delete('/:id', authenticateToken, postsController.deletePost);

module.exports = router;
