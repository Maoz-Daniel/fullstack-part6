const express = require('express');
const photosController = require('../controllers/photosController');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.use(authenticateToken);

router.get('/', photosController.listPhotos);
router.get('/:id', photosController.getPhoto);
router.post('/', photosController.createPhoto);
router.put('/:id', photosController.updatePhoto);
router.delete('/:id', photosController.deletePhoto);

module.exports = router;
