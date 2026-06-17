const comments = require('../db/comments');
const posts = require('../db/posts');
const { safeLogAction } = require('../db/userActions');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/commentSchemas');

async function listComments(req, res) {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const list = await comments.listComments({ postId: value.postId, userId: value.userId });
  return res.json(list);
}

async function getComment(req, res) {
  const comment = await comments.getCommentById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  return res.json(comment);
}

async function createComment(req, res) {
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

  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'comment_create',
    resourceType: 'comment',
    resourceId: created.id,
    details: `created comment ${created.id} on post ${created.post_id}`,
  });
  return res.status(201).json(created);
}

async function updateComment(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await comments.getCommentById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Comment not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own comments' });
  }

  const updated = await comments.updateComment(req.params.id, value);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'comment_update',
    resourceType: 'comment',
    resourceId: updated.id,
    details: `updated comment ${updated.id}`,
  });
  return res.json(updated);
}

async function deleteComment(req, res) {
  const existing = await comments.getCommentById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Comment not found' });
  if (existing.user_id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }

  await comments.softDeleteComment(req.params.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'comment_delete',
    resourceType: 'comment',
    resourceId: existing.id,
    details: `deleted comment ${existing.id}`,
  });
  return res.json(existing);
}

module.exports = {
  listComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
};
