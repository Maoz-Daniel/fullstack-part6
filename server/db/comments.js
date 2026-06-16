// Data-access layer for comments.
const { query } = require('./connection');

// List active comments, optionally filtered by postId and/or userId.
async function listComments({ postId, userId } = {}) {
  const where = ['comments.deleted_at IS NULL'];
  const params = [];

  if (postId !== undefined) {
    where.push('comments.post_id = ?');
    params.push(postId);
  }
  if (userId !== undefined) {
    where.push('comments.user_id = ?');
    params.push(userId);
  }

  return query(
    `SELECT comments.id, comments.post_id, comments.user_id, users.email AS user_email, comments.body
     FROM comments
     JOIN users ON users.id = comments.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY comments.id`,
    params
  );
}

// Single active comment by id, or undefined if missing/soft-deleted.
async function getCommentById(id) {
  const rows = await query(
    `SELECT comments.id, comments.post_id, comments.user_id, users.email AS user_email, comments.body
     FROM comments
     JOIN users ON users.id = comments.user_id
     WHERE comments.id = ? AND comments.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Insert a comment, then return the stored row.
async function createComment({ postId, userId, body }) {
  const result = await query(
    'INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)',
    [postId, userId, body]
  );
  return getCommentById(result.insertId);
}

// Update the comment body on an active comment, then return the updated row.
async function updateComment(id, fields) {
  await query(
    `UPDATE comments
     SET body = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [fields.body, id]
  );
  return getCommentById(id);
}

// Soft delete one active comment.
async function softDeleteComment(id) {
  await query(
    'UPDATE comments SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
}

module.exports = {
  listComments,
  getCommentById,
  createComment,
  updateComment,
  softDeleteComment,
};
