// /posts routes - full CRUD with JWT-based ownership enforcement for writes.
const express = require('express');
const posts = require('../db/posts');
const { safeLogAction } = require('../db/userActions');
const { authenticateToken } = require('../middleware/authenticateToken');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/postSchemas');

const router = express.Router();

// GET /posts -> active posts, optional ?userId= filter.
router.get('/', async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query);

  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, userId } = value;
  const rows = await posts.listPosts({
    userId,
    limit,
    offset: (page - 1) * limit,
  });

  sendPaginated(req, res, rows, { page, limit, query: value });
});

// GET /posts/:id -> single active post, or 404.
router.get('/:id', async (req, res) => {
  const post = await posts.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /posts -> create for the authenticated user identified by the JWT.
router.post('/', authenticateToken, async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const created = await posts.createPost({
    userId: req.activeUserId,
    title: value.title,
    body: value.body,
  });

  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'post_create',
    resourceType: 'post',
    resourceId: created.id,
    details: `created post ${created.id}`,
  });
  res.status(201).json(created);
});

// PUT /posts/:id -> update only if the post belongs to the authenticated user.
router.put('/:id', authenticateToken, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await posts.getPostById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own posts' });
  }

  const updated = await posts.updatePost(req.params.id, value);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'post_update',
    resourceType: 'post',
    resourceId: updated.id,
    details: `updated post ${updated.id}`,
  });
  res.json(updated);
});

// DELETE /posts/:id -> soft delete only if the post belongs to the authenticated user.
router.delete('/:id', authenticateToken, async (req, res) => {
  const existing = await posts.getPostById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only delete your own posts' });
  }

  await posts.softDeletePost(req.params.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'post_delete',
    resourceType: 'post',
    resourceId: existing.id,
    details: `deleted post ${existing.id}`,
  });
  res.json(existing);
});

module.exports = router;
