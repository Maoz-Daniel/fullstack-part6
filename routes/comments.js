// /comments routes — full CRUD with x-user-id based ownership enforcement for writes.
const express = require('express');
const comments = require('../db/comments');
const posts = require('../db/posts');
const { requireActiveUser } = require('../middleware/requireActiveUser');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/commentSchemas');

const router = express.Router();

// GET /comments -> active comments, optional ?postId= and/or ?userId= filters.
router.get('/', async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const list = await comments.listComments({ postId: value.postId, userId: value.userId });
  res.json(list);
});

// GET /comments/:id -> single active comment, or 404.
router.get('/:id', async (req, res) => {
  const comment = await comments.getCommentById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  res.json(comment);
});

// POST /comments -> create for the active user, on an active post.
router.post('/', requireActiveUser, async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const post = await posts.getPostById(value.post_id);
  if (!post) {
    return res.status(400).json({ error: 'post_id does not reference an existing active post' });
  }

  const created = await comments.createComment({
    postId: value.post_id,
    userId: req.activeUserId,
    body: value.body,
  });

  res.status(201).json(created);
});

// PUT /comments/:id -> update only if the comment belongs to the active user.
router.put('/:id', requireActiveUser, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await comments.getCommentById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Comment not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own comments' });
  }

  const updated = await comments.updateComment(req.params.id, value);
  res.json(updated);
});

// DELETE /comments/:id -> soft delete only if the comment belongs to the active user.
router.delete('/:id', requireActiveUser, async (req, res) => {
  const existing = await comments.getCommentById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Comment not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }

  await comments.softDeleteComment(req.params.id);
  res.json(existing);
});

module.exports = router;
