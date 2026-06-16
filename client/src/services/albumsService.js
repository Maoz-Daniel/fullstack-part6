import { apiClient } from './apiClient.js';
import { getCached, setCached, deleteByPrefix } from './cacheStore.js';
import { readSessionUser } from '../utils/session.js';

export const ALBUM_PAGE_SIZE = 3;

function normalizeAlbum(album) {
  return {
    ...album,
    id: Number(album.id),
    user_id: Number(album.user_id),
    photo_count: Number(album.photo_count),
  };
}

// Cache/invalidate per active user — albums are private, so the owner scopes every key.
function albumsPrefix() {
  const user = readSessionUser();
  return `albums:user:${user?.id ?? 'anon'}:`;
}

function invalidateAlbums() {
  deleteByPrefix(albumsPrefix());
}

// One page of the active user's albums, optionally title-filtered. Returns
// `{ data: normalizedAlbums, nextPage }`; served from cache when previously fetched.
export async function getAlbumsPage({ page = 1, q = '' } = {}) {
  const cacheKey = `${albumsPrefix()}q:${q}:page:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ page: String(page), limit: String(ALBUM_PAGE_SIZE) });
  if (q) params.set('q', q);

  const { data, nextPage } = await apiClient(`/albums?${params.toString()}`, {
    withPagination: true,
  });
  const result = { data: data.map(normalizeAlbum), nextPage };

  setCached(cacheKey, result);
  return result;
}

export async function getAlbumById(id) {
  const album = await apiClient(`/albums/${id}`);
  return normalizeAlbum(album);
}

export async function createAlbum(payload) {
  const album = await apiClient('/albums', { method: 'POST', body: payload });
  invalidateAlbums();
  return normalizeAlbum(album);
}

export async function updateAlbum(id, payload) {
  const album = await apiClient(`/albums/${id}`, { method: 'PUT', body: payload });
  invalidateAlbums();
  return normalizeAlbum(album);
}

export async function deleteAlbum(id) {
  const deleted = await apiClient(`/albums/${id}`, { method: 'DELETE' });
  invalidateAlbums();
  deleteByPrefix(`photos:album:${id}:`); // its photos were cascade-deleted too
  return deleted;
}
