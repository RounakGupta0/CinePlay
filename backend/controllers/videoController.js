const Video = require('../models/Video');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const cloudinary = require('../config/cloudinary');

// @desc    Upload video
// @route   POST /api/videos
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'Please upload a video file.' });
    }

    const { title, description, category, tags, isShort } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Video title is required.' });
    }

    const videoFile = req.files.video;
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      return res.status(400).json({ success: false, message: 'Invalid video format. Supported: MP4, MOV, AVI, WebM, MKV.' });
    }

    // Upload video to Cloudinary
    const videoUpload = await cloudinary.uploader.upload(videoFile.tempFilePath, {
      resource_type: 'video',
      folder: 'shareme/videos',
      chunk_size: 6000000,
      eager: [{ quality: 'auto', fetch_format: 'auto' }],
      eager_async: true
    });

    let thumbnailData = { public_id: '', url: '' };
    
    // Upload thumbnail if provided, else auto-generate from video
    if (req.files && req.files.thumbnail) {
      const thumbFile = req.files.thumbnail;
      const thumbUpload = await cloudinary.uploader.upload(thumbFile.tempFilePath, {
        resource_type: 'image',
        folder: 'shareme/thumbnails',
        transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }]
      });
      thumbnailData = { public_id: thumbUpload.public_id, url: thumbUpload.secure_url };
    } else {
      // Auto-generate thumbnail from video at 2 seconds
      const autoThumb = await cloudinary.uploader.upload(videoFile.tempFilePath, {
        resource_type: 'video',
        folder: 'shareme/thumbnails',
        format: 'jpg',
        transformation: [{ width: 1280, height: 720, crop: 'fill', start_offset: '2', quality: 'auto' }]
      });
      thumbnailData = { public_id: autoThumb.public_id, url: autoThumb.secure_url };
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [];
    
    // Check max duration for shorts (2 minutes = 120s with small margin)
    const isExplicitShort = isShort === true || isShort === 'true';
    if (isExplicitShort && videoUpload.duration && videoUpload.duration > 125) {
      if (videoUpload.public_id) {
        await cloudinary.uploader.destroy(videoUpload.public_id, { resource_type: 'video' });
      }
      return res.status(400).json({
        success: false,
        message: 'Short videos must be 2 minutes (120 seconds) or less in duration.'
      });
    }

    const isShortFlag = isExplicitShort || category === 'Shorts' || (videoUpload.duration && videoUpload.duration <= 120);

    const video = await Video.create({
      title,
      description: description || '',
      videoFile: {
        public_id: videoUpload.public_id,
        url: videoUpload.secure_url,
        duration: videoUpload.duration || 0
      },
      thumbnail: thumbnailData,
      uploader: req.user._id,
      category: category || (isShortFlag ? 'Shorts' : 'Entertainment'),
      tags: tagsArray,
      isShort: !!isShortFlag
    });

    const populatedVideo = await Video.findById(video._id).populate('uploader', 'username avatar channelName subscribersCount totalViews');

    res.status(201).json({ success: true, message: 'Video uploaded successfully!', video: populatedVideo });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to upload video.' });
  }
};

// @desc    Get all videos (public)
// @route   GET /api/videos
exports.getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    let filter = { isPublic: true };
    if (category && category !== 'All') filter.category = category;

    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'popular') sortOption = { views: -1 };
    else if (sort === 'liked') sortOption = { likesCount: -1 };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('uploader', 'username avatar channelName subscribersCount totalViews')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        hasMore: skip + videos.length < total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch videos.' });
  }
};

// @desc    Get dedicated shorts feed
// @route   GET /api/videos/shorts
exports.getShortsVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      isPublic: true,
      $or: [
        { isShort: true },
        { category: 'Shorts' },
        { 'videoFile.duration': { $lte: 120 } }
      ]
    };

    const [shorts, total] = await Promise.all([
      Video.find(filter)
        .populate('uploader', 'username avatar channelName subscribersCount totalViews')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      shorts,
      total,
      hasMore: skip + shorts.length < total
    });
  } catch (err) {
    console.error('Shorts fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch shorts feed.' });
  }
};

// @desc    Search videos
// @route   GET /api/videos/search
exports.searchVideos = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required.' });

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q, 'i');

    const [videos, total] = await Promise.all([
      Video.find({
        isPublic: true,
        $or: [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }]
      })
        .populate('uploader', 'username avatar channelName subscribersCount totalViews')
        .sort({ views: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Video.countDocuments({
        isPublic: true,
        $or: [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }]
      })
    ]);

    res.json({ success: true, videos, total, query: q });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username avatar channelName channelDescription subscribersCount');

    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    if (!video.isPublic) return res.status(403).json({ success: false, message: 'This video is private.' });

    // Increment view count
    video.views += 1;
    await video.save({ validateBeforeSave: false });

    // Update uploader total views
    await User.findByIdAndUpdate(video.uploader._id, { $inc: { totalViews: 1 } });

    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch video.' });
  }
};

// @desc    Get videos by user
// @route   GET /api/videos/user/:userId
exports.getUserVideos = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ uploader: req.params.userId, isPublic: true })
        .populate('uploader', 'username avatar channelName subscribersCount totalViews')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Video.countDocuments({ uploader: req.params.userId, isPublic: true })
    ]);

    res.json({ success: true, videos, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user videos.' });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own videos.' });
    }

    // Delete from Cloudinary
    if (video.videoFile.public_id) {
      await cloudinary.uploader.destroy(video.videoFile.public_id, { resource_type: 'video' });
    }
    if (video.thumbnail.public_id) {
      await cloudinary.uploader.destroy(video.thumbnail.public_id);
    }

    await Comment.deleteMany({ video: video._id });
    await Like.deleteMany({ video: video._id });
    await Video.deleteOne({ _id: video._id });

    res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete video.' });
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found.' });
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own videos.' });
    }

    const { title, description, category, tags, isPublic, isShort } = req.body;
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;
    if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    if (isPublic !== undefined) video.isPublic = isPublic;
    if (isShort !== undefined) video.isShort = isShort === true || isShort === 'true';

    // Update thumbnail if new one provided
    if (req.files && req.files.thumbnail) {
      if (video.thumbnail.public_id) {
        await cloudinary.uploader.destroy(video.thumbnail.public_id);
      }
      const thumbUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
        resource_type: 'image',
        folder: 'shareme/thumbnails',
        transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }]
      });
      video.thumbnail = { public_id: thumbUpload.public_id, url: thumbUpload.secure_url };
    }

    await video.save();
    const updated = await Video.findById(video._id).populate('uploader', 'username avatar channelName');
    res.json({ success: true, message: 'Video updated successfully.', video: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update video.' });
  }
};
