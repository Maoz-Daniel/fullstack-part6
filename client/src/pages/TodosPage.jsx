import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createTodo, deleteTodo, getTodos, updateTodo } from '../services/todosService.js';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

function getCompletedFilter(filter) {
  if (filter === 'active') return false;
  if (filter === 'completed') return true;
  return undefined;
}

function todoMatchesFilter(todo, filter) {
  const completed = getCompletedFilter(filter);
  return completed === undefined || todo.completed === completed;
}

function sortTodos(todos) {
  return [...todos].sort((first, second) => first.id - second.id);
}

export function TodosPage() {
  const { user } = useOutletContext();
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingTodoId, setPendingTodoId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadTodos() {
      setLoading(true);
      setError('');

      try {
        const list = await getTodos({
          userId: user.id,
          completed: getCompletedFilter(filter),
        });

        if (!ignore) {
          setTodos(list);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTodos();

    return () => {
      ignore = true;
    };
  }, [filter, user.id]);

  async function handleCreate(event) {
    event.preventDefault();
    const title = newTitle.trim();

    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createTodo({
        user_id: user.id,
        title,
        completed: false,
      });

      setNewTitle('');
      setTodos((currentTodos) => {
        if (!todoMatchesFilter(created, filter)) return currentTodos;
        return sortTodos([...currentTodos, created]);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo) {
    setPendingTodoId(todo.id);
    setError('');

    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((currentTodos) => {
        if (!todoMatchesFilter(updated, filter)) {
          return currentTodos.filter((item) => item.id !== updated.id);
        }

        return sortTodos(currentTodos.map((item) => (item.id === updated.id ? updated : item)));
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingTodoId(null);
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle('');
  }

  async function handleUpdateTitle(event, todo) {
    event.preventDefault();
    const title = editTitle.trim();

    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setPendingTodoId(todo.id);
    setError('');

    try {
      const updated = await updateTodo(todo.id, { title });
      setTodos((currentTodos) =>
        sortTodos(currentTodos.map((item) => (item.id === updated.id ? updated : item)))
      );
      cancelEditing();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingTodoId(null);
    }
  }

  async function handleDelete(todo) {
    setPendingTodoId(todo.id);
    setError('');

    try {
      await deleteTodo(todo.id);
      setTodos((currentTodos) => currentTodos.filter((item) => item.id !== todo.id));
      if (editingId === todo.id) {
        cancelEditing();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingTodoId(null);
    }
  }

  return (
    <section className="content-panel todos-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Todos</p>
          <h2>{user.username}'s todos</h2>
        </div>
        <p className="todo-count">{todos.length} shown</p>
      </div>

      <form className="todo-create-form" onSubmit={handleCreate}>
        <label className="form-field todo-create-form__field">
          <span>New todo</span>
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Write a new task"
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add todo'}
        </button>
      </form>

      <div className="todo-filters" aria-label="Todo filters">
        {FILTERS.map((item) => (
          <button
            className={item.value === filter ? 'filter-button filter-button--active' : 'filter-button'}
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? <p className="panel-copy">Loading todos...</p> : null}

      {!loading && todos.length === 0 ? (
        <p className="empty-state">No todos match this view.</p>
      ) : null}

      {!loading && todos.length > 0 ? (
        <ul className="todo-list">
          {todos.map((todo) => {
            const isPending = pendingTodoId === todo.id;
            const isEditing = editingId === todo.id;

            return (
              <li className={todo.completed ? 'todo-item todo-item--done' : 'todo-item'} key={todo.id}>
                <label className="todo-checkbox">
                  <input
                    checked={todo.completed}
                    disabled={isPending}
                    type="checkbox"
                    onChange={() => handleToggle(todo)}
                  />
                  <span>#{todo.id}</span>
                </label>

                {isEditing ? (
                  <form className="todo-edit-form" onSubmit={(event) => handleUpdateTitle(event, todo)}>
                    <input
                      autoFocus
                      className="todo-title-input"
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                    />
                    <button className="button" type="submit" disabled={isPending}>
                      Save
                    </button>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={cancelEditing}
                      disabled={isPending}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className="todo-title">{todo.title}</p>
                    <div className="todo-actions">
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => startEditing(todo)}
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      <button
                        className="button button--danger"
                        type="button"
                        onClick={() => handleDelete(todo)}
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
