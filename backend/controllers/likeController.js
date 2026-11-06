const Like = require('../models/Like');
const Dislike = require('../models/Dislike');
const Video = require('../models/Video');

// @desc    Toggle like on a video
// @route   POST /api/likes/:videoId
exports.toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    const existingLike = await Like.findOne({ user: req.user._id, video: req.params.videoId });
    const existingDislike = await Dislike.findOne({ user: req.user._id, video: req.params.videoId });

    // If already liked, remove like
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      video.likesCount = Math.max(0, (video.likesCount || 0) - 1);
      await video.save({ validateBeforeSave: false });
      return res.json({
        success: true,
        liked: false,
        disliked: false,
        likesCount: video.likesCount,
        dislikesCount: video.dislikesCount || 0,
        message: 'Like removed.'
      });
    }

    // If previously disliked, remove dislike
    if (existingDislike) {
      await Dislike.deleteOne({ _id: existingDislike._id });
      video.dislikesCount = Math.max(0, (video.dislikesCount || 0) - 1);
    }

    await Like.create({ user: req.user._id, video: req.params.videoId });
    video.likesCount = (video.likesCount || 0) + 1;
    await video.save({ validateBeforeSave: false });

    res.json({
      success: true,
      liked: true,
      disliked: false,
      likesCount: video.likesCount,
      dislikesCount: video.dislikesCount || 0,
      message: 'Video liked!'
    });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};

// @desc    Toggle dislike on a video
// @route   POST /api/likes/:videoId/dislike
exports.toggleDislike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    const existingDislike = await Dislike.findOne({ user: req.user._id, video: req.params.videoId });
    const existingLike = await Like.findOne({ user: req.user._id, video: req.params.videoId });

    // If already disliked, remove dislike
    if (existingDislike) {
      await Dislike.deleteOne({ _id: existingDislike._id });
      video.dislikesCount = Math.max(0, (video.dislikesCount || 0) - 1);
      await video.save({ validateBeforeSave: false });
      return res.json({
        success: true,
        liked: false,
        disliked: false,
        likesCount: video.likesCount || 0,
        dislikesCount: video.dislikesCount,
        message: 'Dislike removed.'
      });
    }

    // If previously liked, remove like
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      video.likesCount = Math.max(0, (video.likesCount || 0) - 1);
    }

    await Dislike.create({ user: req.user._id, video: req.params.videoId });
    video.dislikesCount = (video.dislikesCount || 0) + 1;
    await video.save({ validateBeforeSave: false });

    res.json({
      success: true,
      liked: false,
      disliked: true,
      likesCount: video.likesCount || 0,
      dislikesCount: video.dislikesCount,
      message: 'Video disliked.'
    });
  } catch (err) {
    console.error('Dislike error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle dislike.' });
  }
};

// @desc    Check if user liked or disliked a video
// @route   GET /api/likes/:videoId
exports.getLikeStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    let liked = false;
    let disliked = false;
    if (req.user) {
      const [existingLike, existingDislike] = await Promise.all([
        Like.findOne({ user: req.user._id, video: req.params.videoId }),
        Dislike.findOne({ user: req.user._id, video: req.params.videoId })
      ]);
      liked = !!existingLike;
      disliked = !!existingDislike;
    }

    res.json({
      success: true,
      liked,
      disliked,
      likesCount: video.likesCount || 0,
      dislikesCount: video.dislikesCount || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get like status.' });
  }
};

// @desc    Get videos liked by user
// @route   GET /api/likes/feed/me
exports.getLikedVideos = async (req, res) => {
  try {
    const likes = await Like.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    const videoIds = likes.map(l => l.video);

    const videos = await Video.find({ _id: { $in: videoIds }, isPublic: true })
      .populate('uploader', 'username avatar channelName subscribersCount')
      .lean();

    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch liked videos.' });
  }
};
