import { apiClient } from './apiClient.js';

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

  return {
    data: data.map(normalizeTodo),
    nextPage,
  };
}

export async function createTodo(payload) {
  const todo = await apiClient('/todos', {
    method: 'POST',
    body: payload,
  });

  return normalizeTodo(todo);
}

export async function updateTodo(id, payload) {
  const todo = await apiClient(`/todos/${id}`, {
    method: 'PUT',
    body: payload,
  });

  return normalizeTodo(todo);
}

export function deleteTodo(id) {
  return apiClient(`/todos/${id}`, {
    method: 'DELETE',
  });
}
