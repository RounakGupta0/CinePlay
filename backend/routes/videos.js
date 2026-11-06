const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  getVideos,
  getShortsVideos,
  getVideo,
  getUserVideos,
  deleteVideo,
  updateVideo,
  searchVideos
} = require('../controllers/videoController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/search', searchVideos);
router.get('/shorts', getShortsVideos);
router.get('/user/:userId', getUserVideos);
router.get('/', getVideos);
router.get('/:id', optionalAuth, getVideo);
router.post('/', protect, uploadVideo);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);

module.exports = router;
