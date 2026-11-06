const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  videoFile: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number, default: 0 }
  },
  thumbnail: {
    public_id: { type: String, default: '' },
    url: { type: String, default: '' }
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'All',
      'Shorts',
      'Gaming',
      'Music',
      'Technology',
      'Entertainment',
      'Education',
      'Comedy',
      'Vlogs',
      'Travel',
      'Science',
      'Film',
      'Sports',
      'Food',
      'Fashion',
      'News',
      'Art'
    ],
    default: 'Entertainment'
  },
  tags: [{ type: String, trim: true }],
  views: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  isShort: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Text index for search
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ isShort: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
