const { query } = require('./connection');

// List active todos, optionally filtered by userId and/or completed. The WHERE clause
// and params are built dynamically from whichever filters were provided.
async function listTodos({ userId, completed, limit, offset } = {}) {
  const where = ['deleted_at IS NULL'];
  const params = [];
  if (userId !== undefined) {
    where.push('user_id = ?');
    params.push(userId);
  }
  if (completed !== undefined) {
    where.push('completed = ?');
    params.push(completed ? 1 : 0);
  }

  const paginationSql = limit !== undefined && offset !== undefined ? 'LIMIT ? OFFSET ?' : '';
  if (paginationSql) {
    params.push(limit + 1, offset);
  }

  return query(
    `SELECT id, user_id, title, completed FROM todos
     WHERE ${where.join(' AND ')}
     ORDER BY id
     ${paginationSql}`,
    params
  );
}

// Single active todo by id, or undefined if missing/soft-deleted.
async function getTodoById(id) {
  const rows = await query(
    `SELECT id, user_id, title, completed FROM todos
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Insert a todo, then return the freshly stored row (reflects the completed default).
async function createTodo({ user_id, title, completed }) {
  const result = await query(
    'INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)',
    [user_id, title, completed ? 1 : 0]
  );
  return getTodoById(result.insertId);
}

// Update the provided columns on an active todo, then return the updated row.
// `fields` may contain `title` and/or `completed` (caller guarantees >= 1).
async function updateTodo(id, fields) {
  const set = [];
  const params = [];
  if (fields.title !== undefined) {
    set.push('title = ?');
    params.push(fields.title);
  }
  if (fields.completed !== undefined) {
    set.push('completed = ?');
    params.push(fields.completed ? 1 : 0);
  }
  params.push(id);
  await query(
    `UPDATE todos SET ${set.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    params
  );
  return getTodoById(id);
}

// Soft delete: stamp deleted_at. Callers read the row first and return that snapshot.
async function softDeleteTodo(id) {
  await query(
    'UPDATE todos SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
}

module.exports = { listTodos, getTodoById, createTodo, updateTodo, softDeleteTodo };
