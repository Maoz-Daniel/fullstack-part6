import { apiClient } from './apiClient.js';
import { getCached, setCached, deleteByPrefix } from './cacheStore.js';

export const PHOTO_PAGE_SIZE = 6;

function normalizePhoto(photo) {
  return {
    ...photo,
    id: Number(photo.id),
    album_id: Number(photo.album_id),
    user_id: Number(photo.user_id),
  };
}

function photosPrefix(albumId) {
  return `photos:album:${albumId}:`;
}

function invalidatePhotos(albumId) {
  deleteByPrefix(photosPrefix(albumId));
}

// One page of a single album's photos. Returns `{ data: normalizedPhotos, nextPage }`,
// served from cache when previously fetched.
export async function getPhotosPage({ albumId, page = 1 }) {
  const cacheKey = `${photosPrefix(albumId)}page:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    albumId: String(albumId),
    page: String(page),
    limit: String(PHOTO_PAGE_SIZE),
  });

  const { data, nextPage } = await apiClient(`/photos?${params.toString()}`, {
    withPagination: true,
  });
  const result = { data: data.map(normalizePhoto), nextPage };

  setCached(cacheKey, result);
  return result;
}

export async function createPhoto(payload) {
  const photo = await apiClient('/photos', { method: 'POST', body: payload });
  invalidatePhotos(payload.album_id);
  return normalizePhoto(photo);
}

export async function updatePhoto(id, payload) {
  const photo = await apiClient(`/photos/${id}`, { method: 'PUT', body: payload });
  invalidatePhotos(photo.album_id);
  return normalizePhoto(photo);
}

export async function deletePhoto(id, albumId) {
  const deleted = await apiClient(`/photos/${id}`, { method: 'DELETE' });
  invalidatePhotos(albumId);
  return deleted;
}
