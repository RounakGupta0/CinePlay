const express = require('express');
const router = express.Router();
const { toggleLike, toggleDislike, getLikeStatus, getLikedVideos } = require('../controllers/likeController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/feed/me', protect, getLikedVideos);
router.get('/:videoId', optionalAuth, getLikeStatus);
router.post('/:videoId', protect, toggleLike);
router.post('/:videoId/dislike', protect, toggleDislike);

module.exports = router;
