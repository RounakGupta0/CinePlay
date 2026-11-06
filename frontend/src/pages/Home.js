import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import VideoCard from '../components/VideoCard';
import { formatCount } from '../utils/helpers';
import { toast } from 'react-toastify';
import './Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(null);
  const [heroQueue, setHeroQueue] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories for filter strip
  const CATEGORIES = ['All', 'Shorts', 'Gaming', 'Music', 'Technology', 'Entertainment', 'Education', 'Comedy', 'Vlogs', 'Travel', 'Science', 'Film'];

  // Fetch videos from API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/videos', { params: { limit: 24, sort: 'newest' } });
      if (data.success && data.videos) {
        const vids = data.videos;
        setVideos(vids);

        // Find "The Final Chapter" or fallback to first video for hero
        const finalChapter = vids.find(v => v.title.toLowerCase().includes('final chapter')) || vids[0];
        setFeatured(finalChapter);

        // 3 recommended videos for right side of hero
        const queue = vids.filter(v => v._id !== finalChapter?._id).slice(0, 3);
        setHeroQueue(queue);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Section splitting
  const categoryVideos = videos.filter(
    (v) => v.category?.toLowerCase() === activeCategory.toLowerCase()
  );
  const trendingVideos = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
  const recommendedVideos = [...videos].slice(1, 5);
  const recentVideos = [...videos].slice(0, 4);

  // Continue Watching from real viewing history stored in localStorage
  const [continueWatchingItems, setContinueWatchingItems] = useState([]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('cineplay_history') || '[]');
      if (Array.isArray(history) && history.length > 0) {
        setContinueWatchingItems(history.slice(0, 4));
      }
    } catch {}
  }, []);

  // Popular Creators extraction
  const creatorMap = new Map();
  videos.forEach(v => {
    if (v.uploader && !creatorMap.has(v.uploader._id)) {
      creatorMap.set(v.uploader._id, v.uploader);
    }
  });
  const popularCreators = Array.from(creatorMap.values()).slice(0, 4);

  const handleSaveWatchLater = (video) => {
    try {
      const stored = JSON.parse(localStorage.getItem('cineplay_watch_later') || '[]');
      if (!stored.some(v => v._id === video._id)) {
        stored.unshift(video);
        localStorage.setItem('cineplay_watch_later', JSON.stringify(stored));
        toast.success(`"${video.title}" saved to Watch Later`);
      } else {
        toast.info('Already in Watch Later');
      }
    } catch {
      toast.success('Saved to Watch Later');
    }
  };

  return (
    <div className="cineplay-home-page fade-in">
      {/* ============================================================== */}
      {/* HOMEPAGE HERO SECTION                                          */}
      {/* Large cinematic banner, dark gradient, "The Final Chapter"      */}
      {/* Right side: 3 vertically stacked recommended videos             */}
      {/* ============================================================== */}
      {featured && (
        <section className="cinema-hero-section">
          <div className="hero-banner-main">
            {/* Background image with cinematic lighting and dark gradient */}
            <div
              className="hero-backdrop-img"
              style={{
                backgroundImage: `url(${featured.thumbnail?.url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop'})`
              }}
            />
            <div className="hero-gradient-overlay-left" />
            <div className="hero-gradient-overlay-bottom" />

            {/* Left Content Area */}
            <div className="hero-content-left">
              <div className="hero-badge-row">
                <span className="hero-gold-tag">FEATURED VIDEO</span>
                <span className="hero-spec-badge">4K ULTRA HD</span>
                <span className="hero-spec-badge">TRENDING</span>
              </div>

              {/* Title in Elegant Golden Serif Typography */}
              <h1 className="hero-title-serif font-serif">
                {featured.title}
              </h1>

              <p className="hero-description-text">
                {featured.description || 'Watch the latest viral sensation, creative shorts, and gaming highlights from top creators.'}
              </p>

              <div className="hero-meta-bar">
                <span className="meta-creator">Created by <strong>{featured.uploader?.channelName || featured.uploader?.username}</strong></span>
                <span className="meta-dot">·</span>
                <span>{formatCount(featured.views)} Views</span>
                <span className="meta-dot">·</span>
                <span className="meta-rating">{formatCount(featured.likesCount || 0)} Likes</span>
              </div>

              <div className="hero-action-buttons">
                {/* Premium Golden Watch Now Button */}
                <Link to={`/watch/${featured._id}`} className="btn-gold hero-btn-play">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <polygon points="6 4 19 12 6 20 6 4" />
                  </svg>
                  <span>Watch Now</span>
                </Link>

                <button
                  type="button"
                  className="btn-gold-secondary"
                  onClick={() => handleSaveWatchLater(featured)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 6 12 12 16 12" />
                  </svg>
                  <span>Watch Later</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: 3 Vertically Stacked Recommended Videos */}
          <div className="hero-side-stack">
            <div className="stack-header">
              <span className="stack-heading font-serif">Featured Selections</span>
              <span className="stack-count">Curated</span>
            </div>

            <div className="stack-cards-wrapper">
              {heroQueue.map((item) => (
                <Link to={`/watch/${item._id}`} key={item._id} className="stack-item-card">
                  <div className="stack-thumb-wrap">
                    <img
                      src={item.thumbnail?.url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop'}
                      alt={item.title}
                      className="stack-thumb-img"
                    />
                    <div className="stack-thumb-overlay">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <polygon points="6 4 19 12 6 20 6 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="stack-meta">
                    <h4 className="stack-video-title">{item.title}</h4>
                    <span className="stack-creator">{item.uploader?.channelName || item.uploader?.username}</span>
                    <span className="stack-views">{formatCount(item.views)} views</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* CATEGORY FILTER STRIP (MINIMAL DARK LUXURY)                    */}
      {/* ============================================================== */}
      <div className="discovery-filter-strip">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-pill-luxury ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* DISCOVERY SECTIONS: CATEGORY FILTERED OR FULL SECTIONS         */}
      {/* ============================================================== */}
      {activeCategory !== 'All' ? (
        <section className="discovery-section">
          <div className="section-title-row">
            <div>
              <h2 className="section-title font-serif">{activeCategory} Videos & Shorts</h2>
              <span className="section-subtext">Curated content in {activeCategory}</span>
            </div>
            <button
              type="button"
              className="section-more-link"
              onClick={() => setActiveCategory('All')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>View All Categories</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : categoryVideos.length > 0 ? (
            <div className="discovery-grid">
              {categoryVideos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>
          ) : (
            <div className="empty-cinema-slate">
              <div className="empty-symbol font-serif">🎬</div>
              <h3 className="font-serif">No {activeCategory} Videos Yet</h3>
              <p>Be the first creator to share your videos or shorts in {activeCategory}!</p>
              <Link to="/upload" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Upload to {activeCategory}</span>
              </Link>
            </div>
          )}
        </section>
      ) : !loading && videos.length === 0 ? (
        <div className="empty-cinema-slate" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="empty-symbol font-serif" style={{ fontSize: '3rem', marginBottom: '16px' }}>🎬</div>
          <h3 className="font-serif" style={{ fontSize: '1.6rem', marginBottom: '10px' }}>No Videos Uploaded Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            The CinePlay cinema catalog is clean and ready for your content. Be the first creator to share your videos or shorts!
          </p>
          <Link to="/upload" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: '30px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Upload Your First Video</span>
          </Link>
        </div>
      ) : (
        <>
          {/* 1. CONTINUE WATCHING                                           */}
          {continueWatchingItems.length > 0 && (
            <section className="discovery-section">
              <div className="section-title-row">
                <div>
                  <h2 className="section-title font-serif">Continue Watching</h2>
                  <span className="section-subtext">Pick up right where you left off</span>
                </div>
              </div>

              <div className="discovery-grid grid-continue">
                {continueWatchingItems.map((vid) => (
                  <VideoCard
                    key={`cw-${vid._id}`}
                    video={vid}
                    progressPercent={vid.progress}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 2. TRENDING NOW                                                */}
          <section className="discovery-section">
            <div className="section-title-row">
              <div>
                <h2 className="section-title font-serif">Trending Now</h2>
                <span className="section-subtext">The most viewed cinema and creator highlights</span>
              </div>
              <Link to="/explore" className="section-more-link">
                <span>View All</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : (
              <div className="discovery-grid">
                {trendingVideos.map((vid) => (
                  <VideoCard key={vid._id} video={vid} />
                ))}
              </div>
            )}
          </section>

          {/* 3. POPULAR CREATORS                                            */}
          {popularCreators.length > 0 && (
            <section className="discovery-section creators-section">
              <div className="section-title-row">
                <div>
                  <h2 className="section-title font-serif">Popular Creators</h2>
                  <span className="section-subtext">Visionaries shaping cinema and independent storytelling</span>
                </div>
              </div>

              <div className="creators-horizontal-grid">
                {popularCreators.map((creator) => (
                  <div key={creator._id} className="creator-luxury-card">
                    <Link to={`/channel/${creator._id}`} className="creator-card-link">
                      <div className="creator-avatar-wrap">
                        <img
                          src={creator.avatar?.url || `https://ui-avatars.com/api/?name=${creator.username}&background=D6AD62&color=000`}
                          alt={creator.username}
                          className="creator-large-avatar"
                        />
                        <div className="creator-gold-badge">✓</div>
                      </div>
                      <h3 className="creator-channel-name">{creator.channelName || creator.username}</h3>
                      <span className="creator-sub-count">{formatCount(creator.subscribersCount || 0)} Subscribers</span>
                    </Link>
                    <Link to={`/channel/${creator._id}`} className="btn-charcoal creator-visit-btn">
                      View Channel
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. RECOMMENDED FOR YOU                                         */}
          <section className="discovery-section">
            <div className="section-title-row">
              <div>
                <h2 className="section-title font-serif">Recommended For You</h2>
                <span className="section-subtext">Hand-curated titles tailored to your aesthetic</span>
              </div>
            </div>

            <div className="discovery-grid">
              {recommendedVideos.map((vid) => (
                <VideoCard key={`rec-${vid._id}`} video={vid} />
              ))}
            </div>
          </section>

          {/* 5. RECENTLY UPLOADED                                           */}
          <section className="discovery-section">
            <div className="section-title-row">
              <div>
                <h2 className="section-title font-serif">Recently Uploaded</h2>
                <span className="section-subtext">Fresh additions to the CinePlay catalog</span>
              </div>
            </div>

            <div className="discovery-grid">
              {recentVideos.map((vid) => (
                <VideoCard key={`recup-${vid._id}`} video={vid} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Home;
