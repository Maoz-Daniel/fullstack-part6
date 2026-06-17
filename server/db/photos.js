
const { query } = require('./connection');

// List a user's active photos, optional ?albumId= filter, paginated.
// Ownership is enforced through the album (albums.user_id = ?). Fetches `limit + 1` rows so
// the route can detect a next page without COUNT(*).
async function listPhotos({ userId, albumId, limit, offset }) {
  const where = [
    'photos.deleted_at IS NULL',
    'albums.deleted_at IS NULL',
    'albums.user_id = ?',
  ];
  const params = [userId];

  if (albumId !== undefined) {
    where.push('photos.album_id = ?');
    params.push(albumId);
  }

  params.push(limit + 1, offset);

  return query(
    `SELECT photos.id, photos.album_id, photos.title, photos.url, photos.thumbnail_url
     FROM photos
     JOIN albums ON albums.id = photos.album_id
     WHERE ${where.join(' AND ')}
     ORDER BY photos.id
     LIMIT ? OFFSET ?`,
    params
  );
}

// Single active photo by id, or undefined if missing/soft-deleted. Returns photo fields
// only; the route checks ownership via the photo's album.
async function getPhotoById(id) {
  const rows = await query(
    `SELECT photos.id, photos.album_id, photos.title, photos.url, photos.thumbnail_url
     FROM photos
     WHERE photos.id = ? AND photos.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Insert a photo, then return the stored row.
async function createPhoto({ albumId, title, url, thumbnailUrl }) {
  const result = await query(
    'INSERT INTO photos (album_id, title, url, thumbnail_url) VALUES (?, ?, ?, ?)',
    [albumId, title, url, thumbnailUrl]
  );
  return getPhotoById(result.insertId);
}

// Update title/url/thumbnail on an active photo, then return the updated row.
async function updatePhoto(id, fields) {
  const set = [];
  const params = [];

  if (fields.title !== undefined) {
    set.push('title = ?');
    params.push(fields.title);
  }
  if (fields.url !== undefined) {
    set.push('url = ?');
    params.push(fields.url);
  }
  if (fields.thumbnailUrl !== undefined) {
    set.push('thumbnail_url = ?');
    params.push(fields.thumbnailUrl);
  }

  params.push(id);
  await query(
    `UPDATE photos
     SET ${set.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    params
  );

  return getPhotoById(id);
}

// Soft delete one active photo (no cascade).
async function softDeletePhoto(id) {
  await query(
    'UPDATE photos SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
}

module.exports = {
  listPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  softDeletePhoto,
};
