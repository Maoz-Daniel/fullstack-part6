const albums = require('../db/albums');
const { safeLogAction } = require('../db/userActions');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/albumSchemas');

async function listAlbums(req, res) {
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
}

async function getAlbum(req, res) {
  const album = await albums.getAlbumById(req.params.id);
  if (!album || album.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Album not found' });
  }
  return res.json(album);
}

async function createAlbum(req, res) {
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
  return res.status(201).json(created);
}

async function updateAlbum(req, res) {
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
  return res.json(updated);
}

async function deleteAlbum(req, res) {
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
  return res.json(existing);
}

module.exports = { listAlbums, getAlbum, createAlbum, updateAlbum, deleteAlbum };
