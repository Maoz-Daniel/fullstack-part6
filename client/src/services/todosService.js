import { apiClient } from './apiClient.js';
import { deleteByPrefix, getCached, setCached } from './cacheStore.js';

function normalizeTodo(todo) {
  return {
    ...todo,
    completed: Boolean(todo.completed),
  };
}

export async function getTodos({ userId, completed }) {
  const params = new URLSearchParams({ userId: String(userId) });

  if (completed !== undefined) {
    params.set('completed', String(completed));
  }

  const todos = await apiClient(`/todos?${params.toString()}`);
  return todos.map(normalizeTodo);
}

export async function getTodosPage({ userId, completed, page = 1, limit = 5 }) {
  const completedKey = completed === undefined ? 'all' : String(completed);
  const cacheKey = `todos:user:${userId}:completed:${completedKey}:page:${page}:limit:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    userId: String(userId),
    page: String(page),
    limit: String(limit),
  });

  if (completed !== undefined) {
    params.set('completed', String(completed));
  }

  const { data, nextPage } = await apiClient(`/todos?${params.toString()}`, {
    withPagination: true,
  });

  const result = {
    data: data.map(normalizeTodo),
    nextPage,
  };
  setCached(cacheKey, result);
  return result;
}

export async function createTodo(payload) {
  const todo = await apiClient('/todos', {
    method: 'POST',
    body: payload,
  });

  deleteByPrefix('todos:');
  deleteByPrefix('todos-view:');
  return normalizeTodo(todo);
}

export async function updateTodo(id, payload) {
  const todo = await apiClient(`/todos/${id}`, {
    method: 'PUT',
    body: payload,
  });

  deleteByPrefix('todos:');
  deleteByPrefix('todos-view:');
  return normalizeTodo(todo);
}

export async function deleteTodo(id) {
  const deleted = await apiClient(`/todos/${id}`, {
    method: 'DELETE',
  });
  deleteByPrefix('todos:');
  deleteByPrefix('todos-view:');
  return normalizeTodo(deleted);
}
