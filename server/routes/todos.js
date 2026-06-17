const express = require('express');
const todosController = require('../controllers/todosController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/', todosController.listTodos);
router.get('/:id', todosController.getTodo);
router.post('/', authenticateToken, todosController.createTodo);
router.put('/:id', authenticateToken, todosController.updateTodo);
router.delete('/:id', authenticateToken, todosController.deleteTodo);

module.exports = router;
