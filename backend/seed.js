const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Video = require('./models/Video');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const Subscription = require('./models/Subscription');
const cloudinary = require('./config/cloudinary');

const CREATORS = [
  {
    username: 'neon_vibe',
    email: 'neon.vibe@shareme.io',
    password: 'password123',
    channelName: 'NeonVibe Studios',
    channelDescription: 'Visual poetry, cyberpunk aesthetics, synthwave soundscapes, and futuristic 3D renders.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&h=400&fit=crop'
  },
  {
    username: 'hyperdrive',
    email: 'hyperdrive@shareme.io',
    password: 'password123',
    channelName: 'HyperDrive Gaming',
    channelDescription: 'High-octane esports highlights, next-gen gameplay, RTX ultra settings, and speedruns.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=400&fit=crop'
  },
  {
    username: 'cosmic_space',
    email: 'cosmic@shareme.io',
    password: 'password123',
    channelName: 'Cosmic Horizon',
    channelDescription: 'Journey through deep cosmos, James Webb discoveries, pulsar audio, and astrophysics documentaries.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&h=400&fit=crop'
  },
  {
    username: 'apex_cinema',
    email: 'apex@shareme.io',
    password: 'password123',
    channelName: 'Apex Cinema',
    channelDescription: 'Independent cinematic shorts, atmospheric color grading, drone footage, and visual storytelling.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1600&h=400&fit=crop'
  }
];

const VIDEO_SEEDS = [
  {
    title: 'The Final Chapter',
    description: 'An elusive truth lies buried beneath the neon shadows of the metropolis. When former detective Elena Vance uncovers the classified Syndicate transmission, every ally becomes a suspect.',
    category: 'Film',
    tags: ['cinema', 'thriller', 'mystery', 'cinematic', '4k'],
    creatorIndex: 3,
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop',
    duration: 28,
    views: 48920,
    likesCount: 3840
  },
  {
    title: 'Neon Odyssey — Cyberpunk 2099 Motion Teaser',
    description: 'Immerse yourself into Neo-Shinjuku. Volumetric rain, holographic signage, and high-frequency synthesized audio. Rendered with Unreal Engine 5.4 in real-time ray tracing.',
    category: 'Entertainment',
    tags: ['cyberpunk', 'scifi', 'blender', 'unrealengine', 'neon'],
    creatorIndex: 0,
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&h=720&fit=crop',
    duration: 15,
    views: 14250,
    likesCount: 1240
  },
  {
    title: 'The Great Nebula Expedition | Deep Cosmos 4K',
    description: 'Captured using narrowband filters: exploring stellar nurseries and ionized hydrogen clouds across the Carina and Orion arms. Sit back and watch the universe unfold.',
    category: 'Science',
    tags: ['astronomy', 'cosmos', 'space', 'nebula', 'documentary'],
    creatorIndex: 2,
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&h=720&fit=crop',
    duration: 15,
    views: 8930,
    likesCount: 785
  },
  {
    title: 'Apex Legends Final Circle Clutch — 1v3 Ranked Predator',
    description: 'Down to 15 HP with no shields, watch how movement tech and tap-strafing turned an impossible 1v3 into a game-winning champion screen.',
    category: 'Gaming',
    tags: ['gaming', 'apexlegends', 'esports', 'fps', 'clutch'],
    creatorIndex: 1,
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1280&h=720&fit=crop',
    duration: 15,
    views: 29400,
    likesCount: 2310
  },
  {
    title: 'Midnight Highway — Retro Synthwave Visualizer',
    description: 'Endless grid, purple horizons, and soothing analog synth pads. The ultimate late-night driving and coding soundtrack experience.',
    category: 'Music',
    tags: ['synthwave', 'retrowave', 'chill', 'music', 'ambient'],
    creatorIndex: 0,
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&h=720&fit=crop',
    duration: 20,
    views: 18760,
    likesCount: 1620
  },
  {
    title: 'Tokyo Rain & Shadows — 35mm Cinematic Film Short',
    description: 'Shot on Kodak Vision3 500T with anamorphic lenses across Shibuya and Shinjuku alleyways during midnight drizzle.',
    category: 'Film',
    tags: ['cinema', 'filmmaking', 'tokyo', 'rain', 'anamorphic'],
    creatorIndex: 3,
    videoSource: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1280&h=720&fit=crop',
    duration: 8,
    views: 6540,
    likesCount: 540
  },
  {
    title: 'Next-Gen Neural Interfaces & Quantum Computing',
    description: 'An overview of brain-computer interfaces (BCIs) integrated with low-latency quantum co-processors. Where hardware meets biological consciousness.',
    category: 'Technology',
    tags: ['technology', 'quantum', 'ai', 'neurotech', 'future'],
    creatorIndex: 2,
    videoSource: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&h=720&fit=crop',
    duration: 12,
    views: 11200,
    likesCount: 970
  },
  {
    title: 'Underwater Bioluminescence — Alien Reefs of Earth',
    description: 'Deep marine footage highlighting fluorescing corals, comb jellies, and deep oceanic predators producing cold chemical light.',
    category: 'Science',
    tags: ['ocean', 'bioluminescence', 'nature', 'wildlife', 'science'],
    creatorIndex: 3,
    videoSource: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1280&h=720&fit=crop',
    duration: 10,
    views: 7420,
    likesCount: 610
  },
  {
    title: 'Speedrun Mastery — Sub-15 Minute Portal Route',
    description: 'Explaining edge glitching, save-state frame perfect jumps, and portal momentum preservation in this world-record pace breakdown.',
    category: 'Gaming',
    tags: ['speedrun', 'gaming', 'portal', 'worldrecord', 'glitch'],
    creatorIndex: 1,
    videoSource: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailSource: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1280&h=720&fit=crop',
    duration: 10,
    views: 15300,
    likesCount: 1190
  }
];

const COMMENTS_SEED = [
  'The visual styling and color grade on this is absolute perfection! 🔥',
  'Watched this three times in a row, the audio-visual sync is unreal.',
  'ShareMe is looking incredible. Love the Midnight Indigo aesthetic!',
  'Instant subscribe! Please drop a tutorial on your lighting setup.',
  'That transition at 0:08 was so clean! What software did you use?'
];

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas.');

    // Clear previous seeded items (optional / clean seed)
    console.log('Cleaning existing demo data...');
    await Promise.all([
      User.deleteMany({ email: { $in: CREATORS.map(c => c.email) } }),
      Video.deleteMany({ title: { $in: VIDEO_SEEDS.map(v => v.title) } }),
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Subscription.deleteMany({})
    ]);

    // 1. Create creators
    console.log('Creating verified channel owners...');
    const createdUsers = [];
    for (const c of CREATORS) {
      const user = await User.create({
        username: c.username,
        email: c.email,
        password: c.password,
        channelName: c.channelName,
        channelDescription: c.channelDescription,
        avatar: { url: c.avatar, public_id: '' },
        channelBanner: { url: c.banner, public_id: '' },
        isVerified: true,
        subscribersCount: Math.floor(Math.random() * 5000) + 1200,
        totalViews: 0
      });
      createdUsers.push(user);
      console.log(`  👤 Created Channel: ${user.channelName} (@${user.username})`);
    }

    // Upload first 2 videos to user Cloudinary account to verify Cloudinary integration, and upload thumbnails
    console.log('\nUploading demo videos and thumbnails to Cloudinary...');
    const createdVideos = [];

    for (let i = 0; i < VIDEO_SEEDS.length; i++) {
      const vSeed = VIDEO_SEEDS[i];
      const creator = createdUsers[vSeed.creatorIndex];

      let videoUrl = vSeed.videoSource;
      let videoPublicId = `demo_video_${i}`;

      // Upload thumbnail to Cloudinary for instant high performance
      let thumbUrl = vSeed.thumbnailSource;
      let thumbPublicId = `demo_thumb_${i}`;

      try {
        const thumbUpload = await cloudinary.uploader.upload(vSeed.thumbnailSource, {
          folder: 'shareme/thumbnails',
          transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }]
        });
        thumbUrl = thumbUpload.secure_url;
        thumbPublicId = thumbUpload.public_id;
      } catch (uploadErr) {
        console.warn(`  ⚠️ Thumbnail upload notice for video ${i + 1}: ${uploadErr.message}. Using fallback CDN.`);
      }

      // For the first video, upload to Cloudinary directly
      if (i === 0) {
        try {
          console.log('  Uploading sample video to Cloudinary...');
          const vidUpload = await cloudinary.uploader.upload(vSeed.videoSource, {
            resource_type: 'video',
            folder: 'shareme/videos'
          });
          videoUrl = vidUpload.secure_url;
          videoPublicId = vidUpload.public_id;
          console.log('  ✅ Cloudinary video uploaded:', videoUrl);
        } catch (vidErr) {
          console.warn('  ⚠️ Direct video upload fallback to CDN URL:', vidErr.message);
        }
      }

      const video = await Video.create({
        title: vSeed.title,
        description: vSeed.description,
        category: vSeed.category,
        tags: vSeed.tags,
        duration: vSeed.duration,
        views: vSeed.views,
        likesCount: vSeed.likesCount,
        uploader: creator._id,
        videoFile: {
          url: videoUrl,
          public_id: videoPublicId,
          duration: vSeed.duration
        },
        thumbnail: {
          url: thumbUrl,
          public_id: thumbPublicId
        },
        isPublic: true
      });

      createdVideos.push(video);
      await User.findByIdAndUpdate(creator._id, { $inc: { totalViews: vSeed.views } });
      console.log(`  🎬 Seeded Video [${vSeed.category}]: "${video.title}"`);
    }

    // 2. Add realistic comments
    console.log('\nGenerating video comments...');
    for (let i = 0; i < createdVideos.length; i++) {
      const vid = createdVideos[i];
      // Pick 2 random different creators as commenters
      for (let j = 0; j < 2; j++) {
        const commenter = createdUsers[(i + j + 1) % createdUsers.length];
        const commentMsg = COMMENTS_SEED[(i + j) % COMMENTS_SEED.length];
        await Comment.create({
          video: vid._id,
          author: commenter._id,
          text: commentMsg
        });
      }
      await Video.findByIdAndUpdate(vid._id, { commentsCount: 2 });
    }

    // 3. Create cross-subscriptions between creators (without self-subscribing!)
    console.log('\nCreating cross-channel subscriptions...');
    for (let i = 0; i < createdUsers.length; i++) {
      const subscriber = createdUsers[i];
      const targetChannel = createdUsers[(i + 1) % createdUsers.length];

      // Channel owner can't subscribe to themselves
      if (subscriber._id.toString() !== targetChannel._id.toString()) {
        await Subscription.create({
          subscriber: subscriber._id,
          channel: targetChannel._id
        });
        console.log(`  🔗 @${subscriber.username} subscribed to @${targetChannel.username}`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`   - ${createdUsers.length} Creator Channels Created`);
    console.log(`   - ${createdVideos.length} High-Definition Cinematic Videos Uploaded`);
    console.log(`   - Comments and Subscriptions Seeded`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();

