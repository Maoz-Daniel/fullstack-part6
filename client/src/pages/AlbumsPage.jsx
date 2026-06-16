import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { usePaginatedItems } from '../hooks/usePaginatedItems.js';
import {
  createAlbum,
  deleteAlbum,
  getAlbumsPage,
  updateAlbum,
} from '../services/albumsService.js';

export function AlbumsPage() {
  const { user } = useOutletContext();
  const {
    items: albums,
    setItems,
    nextPage,
    isLoadingMore,
    loadMore,
    replaceFirstPage,
  } = usePaginatedItems([], null);

  const [query, setQuery] = useState(''); // submitted search term (server-side ?q=)
  const [searchInput, setSearchInput] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState('');

  // Load the first page whenever the submitted search term changes.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    getAlbumsPage({ page: 1, q: query })
      .then((pageData) => {
        if (!ignore) replaceFirstPage(pageData);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // replaceFirstPage is stable enough for our needs; only re-run on a new search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSearch(event) {
    event.preventDefault();
    setQuery(searchInput.trim());
  }

  function handleLoadMore() {
    setError('');
    loadMore((page) => getAlbumsPage({ page, q: query })).catch((err) => setError(err.message));
  }

  async function handleCreate(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError('Album title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await createAlbum({ title });
      setNewTitle('');
      // New album has the highest id, so it belongs at the end of the id-sorted list.
      setItems((current) => [...current, created]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(album) {
    setEditingId(album.id);
    setEditTitle(album.title);
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle('');
  }

  async function handleUpdate(event, album) {
    event.preventDefault();
    const title = editTitle.trim();
    if (!title) {
      setError('Album title is required.');
      return;
    }

    setPendingId(album.id);
    setError('');
    try {
      const updated = await updateAlbum(album.id, { title });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      cancelEditing();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(album) {
    setPendingId(album.id);
    setError('');
    try {
      await deleteAlbum(album.id);
      setItems((current) => current.filter((item) => item.id !== album.id));
      if (editingId === album.id) cancelEditing();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="content-panel albums-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Albums</p>
          <h2>{user.username}'s albums</h2>
        </div>
        <p className="todo-count">{albums.length} shown</p>
      </div>

      <form className="album-create-form" onSubmit={handleCreate}>
        <label className="form-field album-create-form__field">
          <span>New album</span>
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Name your album"
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add album'}
        </button>
      </form>

      <form className="album-search-form" onSubmit={handleSearch} role="search">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search albums by title"
          aria-label="Search albums by title"
        />
        <button className="button button--secondary" type="submit">
          Search
        </button>
        {query ? (
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              setSearchInput('');
              setQuery('');
            }}
          >
            Clear
          </button>
        ) : null}
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? <p className="panel-copy">Loading albums...</p> : null}

      {!loading && albums.length === 0 ? (
        <p className="empty-state">{query ? 'No albums match your search.' : 'No albums yet.'}</p>
      ) : null}

      {!loading && albums.length > 0 ? (
        <ul className="album-grid">
          {albums.map((album) => {
            const isEditing = editingId === album.id;
            const isPending = pendingId === album.id;
            const canManage = album.user_id === user.id;

            return (
              <li className="album-card" key={album.id}>
                <div className="album-card__meta">
                  <span className="album-id">#{album.id}</span>
                  <span className="album-card__count">{album.photo_count} photos</span>
                </div>

                {isEditing ? (
                  <form className="album-edit-form" onSubmit={(event) => handleUpdate(event, album)}>
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                    />
                    <div className="album-card__actions">
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
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="album-card__title">{album.title}</h3>
                    <div className="album-card__actions">
                      <Link
                        className="button"
                        to={`/users/${user.username}/albums/${album.id}/photos`}
                      >
                        Open photos
                      </Link>
                      {canManage ? (
                        <>
                          <button
                            className="button button--secondary"
                            type="button"
                            onClick={() => startEditing(album)}
                            disabled={isPending}
                          >
                            Edit
                          </button>
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => handleDelete(album)}
                            disabled={isPending}
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && nextPage ? (
        <div className="load-more">
          <button
            className="button button--secondary"
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
