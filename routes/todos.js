// /todos routes - full CRUD. Reads stay public; writes require a valid JWT and
// enforce ownership via req.activeUserId.
const express = require('express');
const todos = require('../db/todos');
const { authenticateToken } = require('../middleware/authenticateToken');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/todoSchemas');

const router = express.Router();

// GET /todos -> active todos, optional ?userId= and ?completed= filters.
router.get('/', async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const list = await todos.listTodos({ userId: value.userId, completed: value.completed });
  res.json(list);
});

// GET /todos/:id -> single active todo, or 404.
router.get('/:id', async (req, res) => {
  const todo = await todos.getTodoById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

// POST /todos -> create for the authenticated user. The owner comes from the JWT.
router.post('/', authenticateToken, async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const created = await todos.createTodo({
    user_id: req.activeUserId,
    title: value.title,
    completed: value.completed,
  });

  return res.status(201).json(created);
});

// PUT /todos/:id -> update only if the todo belongs to the authenticated user.
router.put('/:id', authenticateToken, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await todos.getTodoById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Todo not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own todos' });
  }

  const updated = await todos.updateTodo(req.params.id, value);
  res.json(updated);
});

// DELETE /todos/:id -> soft delete only if the todo belongs to the authenticated user.
router.delete('/:id', authenticateToken, async (req, res) => {
  const todo = await todos.getTodoById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (todo.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only delete your own todos' });
  }

  await todos.softDeleteTodo(req.params.id);
  res.json(todo);
});

module.exports = router;
