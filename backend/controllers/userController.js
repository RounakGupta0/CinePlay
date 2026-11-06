const User = require('../models/User');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const cloudinary = require('../config/cloudinary');

// @desc    Get user profile (channel)
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -emailVerificationToken -emailVerificationExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { channelName, channelDescription } = req.body;
    const user = await User.findById(req.user._id);

    if (channelName) user.channelName = channelName;
    if (channelDescription !== undefined) user.channelDescription = channelDescription;

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      if (user.avatar.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
      const avatarUpload = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
        resource_type: 'image',
        folder: 'shareme/avatars',
        transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }]
      });
      user.avatar = { public_id: avatarUpload.public_id, url: avatarUpload.secure_url };
    }

    // Handle banner upload
    if (req.files && req.files.banner) {
      if (user.channelBanner.public_id) {
        await cloudinary.uploader.destroy(user.channelBanner.public_id);
      }
      const bannerUpload = await cloudinary.uploader.upload(req.files.banner.tempFilePath, {
        resource_type: 'image',
        folder: 'shareme/banners',
        transformation: [{ width: 2560, height: 424, crop: 'fill', quality: 'auto' }]
      });
      user.channelBanner = { public_id: bannerUpload.public_id, url: bannerUpload.secure_url };
    }

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
