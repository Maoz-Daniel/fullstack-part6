// /albums routes (Stage F bonus). Albums are PRIVATE: every route requires a valid JWT
// and reads are scoped to the authenticated user, so another user's albums are never
// visible - even with a hand-typed id in the URL.
const express = require('express');
const albums = require('../db/albums');
const { safeLogAction } = require('../db/userActions');
const { authenticateToken } = require('../middleware/authenticateToken');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/albumSchemas');

const router = express.Router();

// All album routes require authentication (reads included).
router.use(authenticateToken);

// GET /albums -> the active user's albums, paginated (?page=&limit=) with optional ?q= search.
router.get('/', async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, q } = value;
  const rows = await albums.listAlbums({
    userId: req.activeUserId,
    q,
    limit,
    offset: (page - 1) * limit,
  });

  sendPaginated(req, res, rows, { page, limit, query: value });
});

// GET /albums/:id -> a single album the active user owns, else 404 (404 not 403 so we don't
// leak that an album with that id exists for someone else).
router.get('/:id', async (req, res) => {
  const album = await albums.getAlbumById(req.params.id);
  if (!album || album.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Album not found' });
  }
  res.json(album);
});

// POST /albums -> create for the authenticated user.
router.post('/', async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const created = await albums.createAlbum({ userId: req.activeUserId, title: value.title });
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'album_create',
    resourceType: 'album',
    resourceId: created.id,
    details: `created album ${created.id}`,
  });
  res.status(201).json(created);
});

// PUT /albums/:id -> update only if owned by the authenticated user.
router.put('/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await albums.getAlbumById(req.params.id);
  if (!existing || existing.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Album not found' });
  }

  const updated = await albums.updateAlbum(req.params.id, value);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'album_update',
    resourceType: 'album',
    resourceId: updated.id,
    details: `updated album ${updated.id}`,
  });
  res.json(updated);
});

// DELETE /albums/:id -> soft delete (cascades to photos) only if owned by the active user.
router.delete('/:id', async (req, res) => {
  const existing = await albums.getAlbumById(req.params.id);
  if (!existing || existing.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Album not found' });
  }

  await albums.softDeleteAlbum(req.params.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'album_delete',
    resourceType: 'album',
    resourceId: existing.id,
    details: `deleted album ${existing.id}`,
  });
  res.json(existing);
});

module.exports = router;
