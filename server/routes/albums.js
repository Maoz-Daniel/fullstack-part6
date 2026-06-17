const express = require('express');
const albumsController = require('../controllers/albumsController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.use(authenticateToken);

router.get('/', albumsController.listAlbums);
router.get('/:id', albumsController.getAlbum);
router.post('/', albumsController.createAlbum);
router.put('/:id', albumsController.updateAlbum);
router.delete('/:id', albumsController.deleteAlbum);

module.exports = router;
