const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @desc    Toggle subscription to a channel
// @route   POST /api/subscriptions/:channelId
exports.toggleSubscription = async (req, res) => {
  try {
    const channelId = req.params.channelId;

    // Prevent self-subscription
    if (channelId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot subscribe to your own channel.' });
    }

    const channel = await User.findById(channelId);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found.' });

    const existingSub = await Subscription.findOne({ subscriber: req.user._id, channel: channelId });

    if (existingSub) {
      await Subscription.deleteOne({ _id: existingSub._id });
      await User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: -1 } });
      const updated = await User.findById(channelId);
      return res.json({ success: true, subscribed: false, subscribersCount: Math.max(0, updated.subscribersCount), message: 'Unsubscribed.' });
    }

    await Subscription.create({ subscriber: req.user._id, channel: channelId });
    await User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: 1 } });
    const updated = await User.findById(channelId);

    res.json({ success: true, subscribed: true, subscribersCount: updated.subscribersCount, message: 'Subscribed!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle subscription.' });
  }
};

// @desc    Check subscription status
// @route   GET /api/subscriptions/check/:channelId
exports.checkSubscription = async (req, res) => {
  try {
    if (!req.user) return res.json({ success: true, subscribed: false });

    const sub = await Subscription.findOne({ subscriber: req.user._id, channel: req.params.channelId });
    res.json({ success: true, subscribed: !!sub });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check subscription.' });
  }
};

// @desc    Get subscriber count for a channel
// @route   GET /api/subscriptions/count/:channelId
exports.getSubscriberCount = async (req, res) => {
  try {
    const count = await Subscription.countDocuments({ channel: req.params.channelId });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get subscriber count.' });
  }
};

// @desc    Get videos from subscribed channels
// @route   GET /api/subscriptions/feed
exports.getSubscribedVideos = async (req, res) => {
  try {
    const Video = require('../models/Video');
    const subscriptions = await Subscription.find({ subscriber: req.user._id }).select('channel');
    const channelIds = subscriptions.map(s => s.channel);

    const videos = await Video.find({ uploader: { $in: channelIds }, isPublic: true })
      .populate('uploader', 'username avatar channelName')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscription feed.' });
  }
};
