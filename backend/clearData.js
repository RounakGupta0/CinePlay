const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Video = require('./models/Video');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const Dislike = require('./models/Dislike');
const Subscription = require('./models/Subscription');
const cloudinary = require('./config/cloudinary');

async function clearDummyData() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not set in backend/.env');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Find all videos to optionally clean up thumbnail assets from Cloudinary
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos to remove.`);

    for (const v of videos) {
      if (v.thumbnail?.public_id && v.thumbnail.public_id.startsWith('shareme/')) {
        try {
          await cloudinary.uploader.destroy(v.thumbnail.public_id);
          console.log(`  🗑️ Deleted thumbnail from Cloudinary: ${v.thumbnail.public_id}`);
        } catch (err) {
          console.warn(`  ⚠️ Could not delete thumbnail ${v.thumbnail.public_id}:`, err.message);
        }
      }
    }

    // 2. Delete all seeded videos
    const vidResult = await Video.deleteMany({});
    console.log(`✅ Deleted ${vidResult.deletedCount} videos from database.`);

    // 3. Delete all comments
    const commentResult = await Comment.deleteMany({});
    console.log(`✅ Deleted ${commentResult.deletedCount} comments from database.`);

    // 4. Delete all likes & dislikes
    const likeResult = await Like.deleteMany({});
    console.log(`✅ Deleted ${likeResult.deletedCount} likes from database.`);

    const dislikeResult = await Dislike.deleteMany({});
    console.log(`✅ Deleted ${dislikeResult.deletedCount} dislikes from database.`);

    // 5. Delete all subscriptions
    const subResult = await Subscription.deleteMany({});
    console.log(`✅ Deleted ${subResult.deletedCount} subscriptions from database.`);

    // 6. Delete seed dummy users (users with email ending in @shareme.io or usernames neon_vibe, hyperdrive, cosmic_space, apex_cinema)
    const userResult = await User.deleteMany({
      $or: [
        { email: { $regex: /@shareme\.io$/i } },
        { username: { $in: ['neon_vibe', 'hyperdrive', 'cosmic_space', 'apex_cinema'] } }
      ]
    });
    console.log(`✅ Deleted ${userResult.deletedCount} dummy creator accounts.`);

    console.log('\n🎉 ALL DUMMY DATA REMOVED SUCCESSFULLY! Database is clean.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing dummy data:', error);
    process.exit(1);
  }
}

clearDummyData();
