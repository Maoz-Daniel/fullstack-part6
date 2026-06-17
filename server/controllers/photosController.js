const photos = require('../db/photos');
const albums = require('../db/albums');
const { safeLogAction } = require('../db/userActions');
const { sendPaginated } = require('../middleware/pagination');
const { createSchema, updateSchema, listQuerySchema } = require('../validation/photoSchemas');

async function listPhotos(req, res) {
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
}

async function getPhoto(req, res) {
  const photo = await photos.getPhotoById(req.params.id);
  if (!photo || photo.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  return res.json(photo);
}

async function createPhoto(req, res) {
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

  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'photo_create',
    resourceType: 'photo',
    resourceId: created.id,
    details: `created photo ${created.id} in album ${created.album_id}`,
  });
  return res.status(201).json(created);
}

async function updatePhoto(req, res) {
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
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'photo_update',
    resourceType: 'photo',
    resourceId: updated.id,
    details: `updated photo ${updated.id}`,
  });
  return res.json(updated);
}

async function deletePhoto(req, res) {
  const existing = await photos.getPhotoById(req.params.id);
  if (!existing || existing.user_id !== req.activeUserId) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  await photos.softDeletePhoto(req.params.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: req.activeUserId,
    actionType: 'photo_delete',
    resourceType: 'photo',
    resourceId: existing.id,
    details: `deleted photo ${existing.id}`,
  });
  return res.json(existing);
}

module.exports = { listPhotos, getPhoto, createPhoto, updatePhoto, deletePhoto };
