import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { usePaginatedItems } from '../hooks/usePaginatedItems.js';
import { getCached, setCached } from '../services/cacheStore.js';
import {
  createAlbum,
  deleteAlbum,
  getAlbumsPage,
  updateAlbum,
} from '../services/albumsService.js';

function formatPhotoCount(count) {
  return count === 1 ? '1 photo' : `${count} photos`;
}

function AlbumIcon() {
  return (
    <svg aria-hidden="true" className="album-card__icon" viewBox="0 0 120 120">
      <rect className="album-card__icon-back" x="20" y="16" width="70" height="88" rx="10" />
      <rect className="album-card__icon-front" x="30" y="26" width="70" height="88" rx="10" />
      <path className="album-card__icon-line" d="M48 50h34" />
      <path className="album-card__icon-line" d="M48 66h26" />
      <circle className="album-card__icon-dot" cx="82" cy="88" r="8" />
    </svg>
  );
}

export function AlbumsPage() {
  const { user } = useOutletContext();
  const {
    items: albums,
    setItems,
    nextPage,
    setNextPage,
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

  function viewCacheKey(currentQuery = query) {
    return `albums-view:user:${user.id}:q:${currentQuery}`;
  }

  // Load the first page whenever the submitted search term changes.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const cachedView = getCached(viewCacheKey(query));
    if (cachedView) {
      setItems(cachedView.items);
      setNextPage(cachedView.nextPage);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    getAlbumsPage({ page: 1, q: query })
      .then((pageData) => {
        if (!ignore) {
          replaceFirstPage(pageData);
          setCached(viewCacheKey(query), { items: pageData.data, nextPage: pageData.nextPage });
        }
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
  }, [query, replaceFirstPage, setItems, setNextPage, user.id]);

  function handleSearch(event) {
    event.preventDefault();
    setQuery(searchInput.trim());
  }

  function handleLoadMore() {
    setError('');
    loadMore(
      (page) => getAlbumsPage({ page, q: query }),
      (mergedItems, mergedNextPage) => {
        setCached(viewCacheKey(), { items: mergedItems, nextPage: mergedNextPage });
      }
    ).catch((err) => setError(err.message));
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
      setItems((current) => {
        const nextAlbums = [...current, created];
        setCached(viewCacheKey(), { items: nextAlbums, nextPage });
        return nextAlbums;
      });
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
      setItems((current) => {
        const nextAlbums = current.map((item) => (item.id === updated.id ? updated : item));
        setCached(viewCacheKey(), { items: nextAlbums, nextPage });
        return nextAlbums;
      });
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
      setItems((current) => {
        const nextAlbums = current.filter((item) => item.id !== album.id);
        setCached(viewCacheKey(), { items: nextAlbums, nextPage });
        return nextAlbums;
      });
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

      <div className="albums-summary">
        <p>
          Browse private albums, search by title, and open an album to manage its photos.
        </p>
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
                <div className="album-card__cover">
                  <AlbumIcon />
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
                    <div className="album-card__content">
                      <div className="album-card__meta">
                        <span className="album-id">#{album.id}</span>
                        <span className="album-card__count">{formatPhotoCount(album.photo_count)}</span>
                      </div>
                      <h3 className="album-card__title">{album.title}</h3>
                    </div>
                    <div className="album-card__actions album-card__actions--stacked">
                      <Link
                        className="button album-open-button"
                        to={`/users/${user.username}/albums/${album.id}/photos`}
                      >
                        Open photos
                      </Link>
                      {canManage ? (
                        <div className="album-card__manage-actions">
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
                        </div>
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
