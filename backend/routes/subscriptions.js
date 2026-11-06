const express = require('express');
const router = express.Router();
const { toggleSubscription, checkSubscription, getSubscriberCount, getSubscribedVideos } = require('../controllers/subscriptionController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/feed', protect, getSubscribedVideos);
router.post('/:channelId', protect, toggleSubscription);
router.get('/check/:channelId', optionalAuth, checkSubscription);
router.get('/count/:channelId', getSubscriberCount);

module.exports = router;
