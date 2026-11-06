const mongoose = require('mongoose');

const dislikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  }
}, { timestamps: true });

dislikeSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('Dislike', dislikeSchema);

