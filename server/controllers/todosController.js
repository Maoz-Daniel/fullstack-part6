const todos = require('../db/todos');
const { safeLogAction } = require('../db/userActions');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/todoSchemas');

async function listTodos(req, res) {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, userId, completed } = value;
  const rows = await todos.listTodos({
    userId,
    completed,
    limit,
    offset: (page - 1) * limit,
  });

  sendPaginated(req, res, rows, { page, limit, query: value });
}

async function getTodo(req, res) {
  const todo = await todos.getTodoById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  return res.json(todo);
}

async function createTodo(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const created = await todos.createTodo({
    user_id: req.activeUserId,
    title: value.title,
    completed: value.completed,
  });

  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'todo_create',
    resourceType: 'todo',
    resourceId: created.id,
    details: `created todo ${created.id}`,
  });

  return res.status(201).json(created);
}

async function updateTodo(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await todos.getTodoById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Todo not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own todos' });
  }

  const updated = await todos.updateTodo(req.params.id, value);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'todo_update',
    resourceType: 'todo',
    resourceId: updated.id,
    details: `updated todo ${updated.id}`,
  });
  return res.json(updated);
}

async function deleteTodo(req, res) {
  const todo = await todos.getTodoById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (todo.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only delete your own todos' });
  }

  await todos.softDeleteTodo(req.params.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'todo_delete',
    resourceType: 'todo',
    resourceId: todo.id,
    details: `deleted todo ${todo.id}`,
  });
  return res.json(todo);
}

module.exports = { listTodos, getTodo, createTodo, updateTodo, deleteTodo };
