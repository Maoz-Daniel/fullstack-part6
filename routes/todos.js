// /todos routes — full CRUD. Thin handlers over db/todos.js. Soft delete via deleted_at.
// No ownership enforcement this slice (todos are open; ownership is a Stage E concern).
const express = require('express');
const todos = require('../db/todos');
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

// POST /todos -> create. 201 + created row. FK miss on user_id -> 400.
router.post('/', async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const created = await todos.createTodo(value);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'user_id does not reference an existing user' });
    }
    throw err; // unexpected -> central error handler -> 500
  }
});

// PUT /todos/:id -> update title and/or completed. 200 + updated row, or 404.
router.put('/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await todos.getTodoById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Todo not found' });

  const updated = await todos.updateTodo(req.params.id, value);
  res.json(updated);
});

// DELETE /todos/:id -> soft delete. Read the row, stamp deleted_at, return the snapshot.
router.delete('/:id', async (req, res) => {
  const todo = await todos.getTodoById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  await todos.softDeleteTodo(req.params.id);
  res.json(todo); // pre-delete snapshot, per CLAUDE.md
});

module.exports = router;
