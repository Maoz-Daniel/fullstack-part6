import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { usePaginatedItems } from '../hooks/usePaginatedItems.js';
import { getAlbumById } from '../services/albumsService.js';
import { getCached, setCached } from '../services/cacheStore.js';
import {
  createPhoto,
  deletePhoto,
  getPhotosPage,
  updatePhoto,
} from '../services/photosService.js';

const EMPTY_PHOTO_FORM = { title: '', url: '', thumbnail_url: '' };

export function AlbumPhotosPage() {
  const { user } = useOutletContext();
  const { albumId: albumIdParam } = useParams();
  const albumId = Number(albumIdParam);
  const navigate = useNavigate();

  const {
    items: photos,
    setItems,
    nextPage,
    setNextPage,
    isLoadingMore,
    loadMore,
    replaceFirstPage,
  } = usePaginatedItems([], null);

  const [album, setAlbum] = useState(null);
  const [photoForm, setPhotoForm] = useState(EMPTY_PHOTO_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PHOTO_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState('');

  function viewCacheKey() {
    return `photos-view:album:${albumId}`;
  }

  // Load the album header + first page of photos. If the album is missing or not ours, the
  // server returns 404 and we bounce back to the albums grid (the server is the real gate).
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    Promise.all([getAlbumById(albumId), getPhotosPage({ albumId, page: 1 })])
      .then(([loadedAlbum, photosPage]) => {
        if (ignore) return;
        setAlbum(loadedAlbum);
        const cachedView = getCached(viewCacheKey());
        if (cachedView) {
          setItems(cachedView.items);
          setNextPage(cachedView.nextPage);
        } else {
          replaceFirstPage(photosPage);
        }
        setCached(viewCacheKey(), {
          items: cachedView ? cachedView.items : photosPage.data,
          nextPage: cachedView ? cachedView.nextPage : photosPage.nextPage,
        });
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 404) {
          navigate(`/users/${user.username}/albums`, { replace: true });
          return;
        }
        setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId, navigate, replaceFirstPage, setItems, setNextPage, user.username]);

  function handlePhotoFormChange(event) {
    const { name, value } = event.target;
    setPhotoForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function handleLoadMore() {
    setError('');
    loadMore(
      (page) => getPhotosPage({ albumId, page }),
      (mergedItems, mergedNextPage) => {
        setCached(viewCacheKey(), { items: mergedItems, nextPage: mergedNextPage });
      }
    ).catch((err) => setError(err.message));
  }

  async function handleCreate(event) {
    event.preventDefault();
    const title = photoForm.title.trim();
    const url = photoForm.url.trim();
    const thumbnail = photoForm.thumbnail_url.trim();

    if (!title || !url || !thumbnail) {
      setError('Photo title, image URL, and thumbnail URL are all required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await createPhoto({
        album_id: albumId,
        title,
        url,
        thumbnail_url: thumbnail,
      });
      setPhotoForm(EMPTY_PHOTO_FORM);
      setItems((current) => {
        const nextPhotos = [...current, created];
        setCached(viewCacheKey(), { items: nextPhotos, nextPage });
        return nextPhotos;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(photo) {
    setEditingId(photo.id);
    setEditForm({ title: photo.title, url: photo.url, thumbnail_url: photo.thumbnail_url });
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(EMPTY_PHOTO_FORM);
  }

  async function handleUpdate(event, photo) {
    event.preventDefault();
    const title = editForm.title.trim();
    const url = editForm.url.trim();
    const thumbnail = editForm.thumbnail_url.trim();

    if (!title || !url || !thumbnail) {
      setError('Photo title, image URL, and thumbnail URL are all required.');
      return;
    }

    setPendingId(photo.id);
    setError('');
    try {
      const updated = await updatePhoto(photo.id, {
        title,
        url,
        thumbnail_url: thumbnail,
      });
      setItems((current) => {
        const nextPhotos = current.map((item) => (item.id === updated.id ? updated : item));
        setCached(viewCacheKey(), { items: nextPhotos, nextPage });
        return nextPhotos;
      });
      cancelEditing();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(photo) {
    setPendingId(photo.id);
    setError('');
    try {
      await deletePhoto(photo.id, albumId);
      setItems((current) => {
        const nextPhotos = current.filter((item) => item.id !== photo.id);
        setCached(viewCacheKey(), { items: nextPhotos, nextPage });
        return nextPhotos;
      });
      if (editingId === photo.id) cancelEditing();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="content-panel photos-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Photos</p>
          <h2>{album ? album.title : 'Album'}</h2>
          <p className="album-photo-meta">
            Album #{albumId}
            {album ? ` · ${album.photo_count} total photos` : ''}
            {photos.length ? ` · ${photos.length} loaded` : ''}
          </p>
        </div>
        <div className="photos-heading-actions">
          <Link className="button button--secondary" to={`/users/${user.username}/albums`}>
            Back to albums
          </Link>
        </div>
      </div>

      <form className="photo-create-form" onSubmit={handleCreate}>
        <div className="photo-create-form__intro">
          <strong>Add a photo</strong>
          <span>Use a full image URL and a smaller thumbnail URL for the grid.</span>
        </div>
        <label className="form-field">
          <span>Title</span>
          <input name="title" value={photoForm.title} onChange={handlePhotoFormChange} />
        </label>
        <label className="form-field">
          <span>Image URL</span>
          <input name="url" value={photoForm.url} onChange={handlePhotoFormChange} />
        </label>
        <label className="form-field">
          <span>Thumbnail URL</span>
          <input
            name="thumbnail_url"
            value={photoForm.thumbnail_url}
            onChange={handlePhotoFormChange}
          />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add photo'}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? <p className="panel-copy">Loading photos...</p> : null}

      {!loading && photos.length === 0 ? (
        <p className="empty-state">No photos in this album yet.</p>
      ) : null}

      {!loading && photos.length > 0 ? (
        <ul className="photo-grid">
          {photos.map((photo) => {
            const isEditing = editingId === photo.id;
            const isPending = pendingId === photo.id;
            const canManage = album?.user_id === user.id;

            return (
              <li className="photo-card" key={photo.id}>
                {isEditing ? (
                  <form className="photo-edit-form" onSubmit={(event) => handleUpdate(event, photo)}>
                    <label className="form-field">
                      <span>Title</span>
                      <input name="title" value={editForm.title} onChange={handleEditFormChange} />
                    </label>
                    <label className="form-field">
                      <span>Image URL</span>
                      <input name="url" value={editForm.url} onChange={handleEditFormChange} />
                    </label>
                    <label className="form-field">
                      <span>Thumbnail URL</span>
                      <input
                        name="thumbnail_url"
                        value={editForm.thumbnail_url}
                        onChange={handleEditFormChange}
                      />
                    </label>
                    <div className="photo-card__actions">
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
                    <a className="photo-card__image" href={photo.url} target="_blank" rel="noreferrer">
                      <img src={photo.thumbnail_url} alt={photo.title} loading="lazy" />
                    </a>
                    <div className="photo-card__body">
                      <div className="photo-card__meta">
                        <span className="photo-id">#{photo.id}</span>
                        <a href={photo.url} target="_blank" rel="noreferrer">
                          Full image
                        </a>
                      </div>
                      <p className="photo-card__title">{photo.title}</p>
                      {canManage ? (
                        <div className="photo-card__actions">
                          <button
                            className="button button--secondary"
                            type="button"
                            onClick={() => startEditing(photo)}
                            disabled={isPending}
                          >
                            Edit
                          </button>
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => handleDelete(photo)}
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
