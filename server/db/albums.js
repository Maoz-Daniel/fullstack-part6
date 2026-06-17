const { query } = require('./connection');

// List a user's active albums, optional ?q= title search, paginated.
// Fetches `limit + 1` rows so the route can detect "is there a next page" without a
// separate COUNT(*). photo_count comes from a correlated subquery (not a JOIN + GROUP BY).
async function listAlbums({ userId, q, limit, offset }) {
  const where = ['albums.deleted_at IS NULL', 'albums.user_id = ?'];
  const params = [userId];

  if (q) {
    where.push('albums.title LIKE ?');
    params.push(`%${q}%`);
  }

  params.push(limit + 1, offset);

  return query(
    `SELECT albums.id, albums.user_id, albums.title,
            (SELECT COUNT(*) FROM photos
             WHERE photos.album_id = albums.id AND photos.deleted_at IS NULL) AS photo_count
     FROM albums
     WHERE ${where.join(' AND ')}
     ORDER BY albums.id
     LIMIT ? OFFSET ?`,
    params
  );
}

// Single active album by id, or undefined if missing/soft-deleted.
async function getAlbumById(id) {
  const rows = await query(
    `SELECT albums.id, albums.user_id, albums.title,
            (SELECT COUNT(*) FROM photos
             WHERE photos.album_id = albums.id AND photos.deleted_at IS NULL) AS photo_count
     FROM albums
     WHERE albums.id = ? AND albums.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Insert an album, then return the stored row.
async function createAlbum({ userId, title }) {
  const result = await query(
    'INSERT INTO albums (user_id, title) VALUES (?, ?)',
    [userId, title]
  );
  return getAlbumById(result.insertId);
}

// Update the title on an active album, then return the updated row.
async function updateAlbum(id, fields) {
  await query(
    `UPDATE albums
     SET title = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [fields.title, id]
  );
  return getAlbumById(id);
}

// Soft delete the album and its photos inside one transaction (cascade in server code).
async function softDeleteAlbum(id) {
  await query('START TRANSACTION');
  try {
    await query(
      'UPDATE photos SET deleted_at = NOW() WHERE album_id = ? AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE albums SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

module.exports = { listAlbums, getAlbumById, createAlbum, updateAlbum, softDeleteAlbum };
