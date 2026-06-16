// Data-access layer for posts. Owns the soft-delete cascade to comments.
const { query } = require('./connection');

// List active posts, optionally filtered by userId.
async function listPosts({ userId } = {}) {
  const where = ['posts.deleted_at IS NULL'];
  const params = [];

  if (userId !== undefined) {
    where.push('posts.user_id = ?');
    params.push(userId);
  }

  return query(
    `SELECT posts.id, posts.user_id, users.email AS user_email, posts.title, posts.body
     FROM posts
     JOIN users ON users.id = posts.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY posts.id`,
    params
  );
}

// Single active post by id, or undefined if missing/soft-deleted.
async function getPostById(id) {
  const rows = await query(
    `SELECT posts.id, posts.user_id, users.email AS user_email, posts.title, posts.body
     FROM posts
     JOIN users ON users.id = posts.user_id
     WHERE posts.id = ? AND posts.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Insert a post, then return the stored row.
async function createPost({ userId, title, body }) {
  const result = await query(
    'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)',
    [userId, title, body]
  );
  return getPostById(result.insertId);
}

// Update title/body on an active post, then return the updated row.
async function updatePost(id, fields) {
  const set = [];
  const params = [];

  if (fields.title !== undefined) {
    set.push('title = ?');
    params.push(fields.title);
  }
  if (fields.body !== undefined) {
    set.push('body = ?');
    params.push(fields.body);
  }

  params.push(id);
  await query(
    `UPDATE posts
     SET ${set.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    params
  );

  return getPostById(id);
}

// Soft delete the post and its comments inside one transaction.
async function softDeletePost(id) {
  await query('START TRANSACTION');
  try {
    await query(
      'UPDATE comments SET deleted_at = NOW() WHERE post_id = ? AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE posts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

module.exports = { listPosts, getPostById, createPost, updatePost, softDeletePost };
