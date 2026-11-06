const express = require('express');
const router = express.Router();
const {
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  toggleCommentDislike
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/:videoId', optionalAuth, getComments);
router.post('/:videoId', protect, addComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleCommentLike);
router.post('/:id/dislike', protect, toggleCommentDislike);

module.exports = router;
