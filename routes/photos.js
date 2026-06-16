// /photos routes (Stage F bonus). Photos are PRIVATE: every route requires a valid JWT and
// reads are scoped to the authenticated user. You can only add photos to your own albums.
const express = require('express');
const photos = require('../db/photos');
const albums = require('../db/albums');
const { authenticateToken } = require('../middleware/authenticateToken');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/photoSchemas');

const router = express.Router();

// All photo routes require authentication (reads included).
router.use(authenticateToken);

// GET /photos -> the active user's photos, optional ?albumId= filter, paginated.
router.get('/', async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, albumId } = value;
  const rows = await photos.listPhotos({
    userId: req.activeUserId,
    albumId,
    limit,
    offset: (page - 1) * limit,
  });

  sendPaginated(req, res, rows, { page, limit, query: value });
});

// GET /photos/:id -> a single photo the active user owns, else 404.
router.get('/:id', async (req, res) => {
  const photo = await photos.getPhotoById(req.params.id);
  if (!photo || photo.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  res.json(photo);
});

// POST /photos -> create on an album the active user owns. The parent album must exist AND
// belong to the active user (you can't drop photos into someone else's album).
router.post('/', async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const album = await albums.getAlbumById(value.album_id);
  if (!album || album.user_id !== req.activeUserId) {
    return res.status(400).json({ error: 'album_id does not reference one of your albums' });
  }

  const created = await photos.createPhoto({
    albumId: value.album_id,
    userId: req.activeUserId,
    title: value.title,
    url: value.url,
    thumbnailUrl: value.thumbnail_url,
  });

  res.status(201).json(created);
});

// PUT /photos/:id -> update only if owned by the authenticated user.
router.put('/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await photos.getPhotoById(req.params.id);
  if (!existing || existing.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const updated = await photos.updatePhoto(req.params.id, {
    title: value.title,
    url: value.url,
    thumbnailUrl: value.thumbnail_url,
  });
  res.json(updated);
});

// DELETE /photos/:id -> soft delete only if owned by the authenticated user.
router.delete('/:id', async (req, res) => {
  const existing = await photos.getPhotoById(req.params.id);
  if (!existing || existing.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  await photos.softDeletePhoto(req.params.id);
  res.json(existing);
});

module.exports = router;
