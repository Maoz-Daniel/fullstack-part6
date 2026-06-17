const posts = require('../db/posts');
const { safeLogAction } = require('../db/userActions');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/postSchemas');

async function listPosts(req, res) {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, userId } = value;
  const rows = await posts.listPosts({
    userId,
    limit,
    offset: (page - 1) * limit,
  });

  sendPaginated(req, res, rows, { page, limit, query: value });
}

async function getPost(req, res) {
  const post = await posts.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.json(post);
}

async function createPost(req, res) {
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
  return res.status(201).json(created);
}

async function updatePost(req, res) {
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
  return res.json(updated);
}

async function deletePost(req, res) {
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
  return res.json(existing);
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
