const Comment = require('../models/Comment');
const Video = require('../models/Video');

// @desc    Get comments for a video
// @route   GET /api/comments/:videoId
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ video: req.params.videoId })
        .populate('author', 'username avatar channelName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Comment.countDocuments({ video: req.params.videoId })
    ]);

    const userIdStr = req.user ? req.user._id.toString() : null;

    const enrichedComments = comments.map(c => {
      const likesList = (c.likes || []).map(id => id.toString());
      const dislikesList = (c.dislikes || []).map(id => id.toString());
      return {
        ...c,
        likesCount: c.likesCount || likesList.length,
        dislikesCount: c.dislikesCount || dislikesList.length,
        isLiked: userIdStr ? likesList.includes(userIdStr) : false,
        isDisliked: userIdStr ? dislikesList.includes(userIdStr) : false
      };
    });

    res.json({ success: true, comments: enrichedComments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
};

// @desc    Add comment
// @route   POST /api/comments/:videoId
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });

    const comment = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      video: req.params.videoId,
      likes: [],
      dislikes: [],
      likesCount: 0,
      dislikesCount: 0
    });

    video.commentsCount = (video.commentsCount || 0) + 1;
    await video.save({ validateBeforeSave: false });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'username avatar channelName')
      .lean();

    res.status(201).json({
      success: true,
      comment: {
        ...populated,
        likesCount: 0,
        dislikesCount: 0,
        isLiked: false,
        isDisliked: false
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('video');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isVideoOwner = comment.video && comment.video.uploader.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isVideoOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    await Comment.deleteOne({ _id: req.params.id });
    await Video.findByIdAndUpdate(comment.video._id || comment.video, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete comment.' });
  }
};

// @desc    Toggle like on a comment
// @route   POST /api/comments/:id/like
exports.toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const userId = req.user._id;
    const userIdStr = userId.toString();

    let likes = (comment.likes || []).map(id => id.toString());
    let dislikes = (comment.dislikes || []).map(id => id.toString());

    let isLiked = false;

    if (likes.includes(userIdStr)) {
      // Remove like
      likes = likes.filter(id => id !== userIdStr);
      isLiked = false;
    } else {
      // Add like
      likes.push(userIdStr);
      isLiked = true;
      // If was disliked, remove dislike
      dislikes = dislikes.filter(id => id !== userIdStr);
    }

    comment.likes = likes;
    comment.dislikes = dislikes;
    comment.likesCount = likes.length;
    comment.dislikesCount = dislikes.length;
    await comment.save({ validateBeforeSave: false });

    res.json({
      success: true,
      isLiked,
      isDisliked: false,
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount
    });
  } catch (err) {
    console.error('Comment like error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle comment like.' });
  }
};

// @desc    Toggle dislike on a comment
// @route   POST /api/comments/:id/dislike
exports.toggleCommentDislike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const userId = req.user._id;
    const userIdStr = userId.toString();

    let likes = (comment.likes || []).map(id => id.toString());
    let dislikes = (comment.dislikes || []).map(id => id.toString());

    let isDisliked = false;

    if (dislikes.includes(userIdStr)) {
      // Remove dislike
      dislikes = dislikes.filter(id => id !== userIdStr);
      isDisliked = false;
    } else {
      // Add dislike
      dislikes.push(userIdStr);
      isDisliked = true;
      // If was liked, remove like
      likes = likes.filter(id => id !== userIdStr);
    }

    comment.likes = likes;
    comment.dislikes = dislikes;
    comment.likesCount = likes.length;
    comment.dislikesCount = dislikes.length;
    await comment.save({ validateBeforeSave: false });

    res.json({
      success: true,
      isLiked: false,
      isDisliked,
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount
    });
  } catch (err) {
    console.error('Comment dislike error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle comment dislike.' });
  }
};
