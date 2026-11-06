import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCount, formatDistanceToNow } from '../utils/helpers';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import './Shorts.css';

const Shorts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const rightFeedRef = useRef(null);

  const [shorts, setShorts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(15);
  const [showCenterIcon, setShowCenterIcon] = useState(null); // 'play' | 'pause'
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  // Comments drawer state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Video reaction cache: { [videoId]: { liked, disliked, likesCount, dislikesCount } }
  const [reactions, setReactions] = useState({});

  // Subscriptions cache: { [uploaderId]: boolean }
  const [subMap, setSubMap] = useState({});
  const [subLoading, setSubLoading] = useState(false);

  // Wheel & Tap debounce trackers
  const lastWheelTime = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Fetch Shorts Feed
  const fetchShortsFeed = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/videos/shorts?limit=50');
      if (data.success && data.shorts) {
        setShorts(data.shorts);

        const initialReactions = {};
        data.shorts.forEach((s) => {
          initialReactions[s._id] = {
            liked: false,
            disliked: false,
            likesCount: s.likesCount || 0,
            dislikesCount: s.dislikesCount || 0,
          };
        });
        setReactions(initialReactions);

        if (id) {
          const matchedIdx = data.shorts.findIndex((s) => s._id === id);
          if (matchedIdx !== -1) {
            setCurrentIndex(matchedIdx);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load shorts feed:', err);
      toast.error('Failed to load shorts feed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShortsFeed();
  }, [fetchShortsFeed]);

  const currentShort = shorts[currentIndex] || null;

  // 2. Synchronize URL and fetch status when active short changes
  useEffect(() => {
    if (!currentShort) return;

    navigate(`/shorts/${currentShort._id}`, { replace: true });
    setProgress(0);
    setIsPlaying(true);
    setMoreMenuOpen(false);

    // Fetch Like status
    const checkReactions = async () => {
      try {
        const { data } = await API.get(`/likes/${currentShort._id}`);
        if (data.success) {
          setReactions((prev) => ({
            ...prev,
            [currentShort._id]: {
              liked: data.liked,
              disliked: data.disliked,
              likesCount: data.likesCount,
              dislikesCount: data.dislikesCount,
            },
          }));
        }
      } catch (e) {}
    };
    checkReactions();

    // Fetch Subscription status
    if (currentShort.uploader?._id && user) {
      const checkSub = async () => {
        try {
          const { data } = await API.get(`/subscriptions/check/${currentShort.uploader._id}`);
          if (data.success) {
            setSubMap((prev) => ({ ...prev, [currentShort.uploader._id]: data.subscribed }));
          }
        } catch (e) {}
      };
      checkSub();
    }

    if (commentsOpen) {
      fetchCommentsForShort(currentShort._id);
    }
  }, [currentIndex, currentShort?._id]); // eslint-disable-line

  // 3. Fetch Comments for active short
  const fetchCommentsForShort = async (videoId) => {
    try {
      setLoadingComments(true);
      const { data } = await API.get(`/comments/${videoId}`);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!commentsOpen && currentShort) {
      fetchCommentsForShort(currentShort._id);
    }
    setCommentsOpen(!commentsOpen);
  };

  // 4. Navigation: Next & Prev
  const goToNext = useCallback(() => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast.info('You have reached the end of the Shorts feed');
    }
  }, [currentIndex, shorts.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const selectShortById = (shortId) => {
    const idx = shorts.findIndex((s) => s._id === shortId);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        setCommentsOpen(false);
        setMoreMenuOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Main stage Wheel navigation with debounce (Only when scrolling outside the right recommended column)
  const handleWheel = (e) => {
    // If mouse is inside right recommendations, do not navigate shorts
    if (rightFeedRef.current && rightFeedRef.current.contains(e.target)) {
      return;
    }

    const now = Date.now();
    if (now - lastWheelTime.current < 450) return;

    if (e.deltaY > 35) {
      lastWheelTime.current = now;
      goToNext();
    } else if (e.deltaY < -35) {
      lastWheelTime.current = now;
      goToPrev();
    }
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
  };

  // Play / Pause toggle
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowCenterIcon('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowCenterIcon('pause');
    }
    setTimeout(() => setShowCenterIcon(null), 500);
  };

  // Tap vs Double Tap detection
  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 280) {
      // Double tap!
      if (!currentReaction.liked) {
        handleLike();
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 850);
    } else {
      // Single tap
      togglePlayPause();
    }
    lastTapTime.current = now;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  // Scrubber click on Short player
  const handleScrubberClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setProgress(pos * 100);
  };

  // Fullscreen
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Video reactions: Like & Dislike
  const currentReaction = (currentShort && reactions[currentShort._id]) || {
    liked: false,
    disliked: false,
    likesCount: currentShort?.likesCount || 0,
    dislikesCount: currentShort?.dislikesCount || 0,
  };

  const handleLike = async () => {
    if (!user) {
      toast.info('Please sign in to like this short');
      navigate('/login');
      return;
    }
    if (!currentShort) return;

    const shortId = currentShort._id;
    const prev = reactions[shortId] || { liked: false, disliked: false, likesCount: 0, dislikesCount: 0 };
    const nextLiked = !prev.liked;
    const nextLikesCount = nextLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1);
    const nextDisliked = nextLiked ? false : prev.disliked;
    const nextDislikesCount = nextLiked && prev.disliked ? Math.max(0, prev.dislikesCount - 1) : prev.dislikesCount;

    setReactions((all) => ({
      ...all,
      [shortId]: {
        liked: nextLiked,
        disliked: nextDisliked,
        likesCount: nextLikesCount,
        dislikesCount: nextDislikesCount,
      },
    }));

    try {
      const { data } = await API.post(`/likes/${shortId}`);
      if (data.success) {
        setReactions((all) => ({
          ...all,
          [shortId]: {
            liked: data.liked,
            disliked: data.disliked,
            likesCount: data.likesCount,
            dislikesCount: data.dislikesCount,
          },
        }));
      }
    } catch (err) {
      setReactions((all) => ({ ...all, [shortId]: prev }));
      toast.error('Could not update like');
    }
  };

  const handleDislike = async () => {
    if (!user) {
      toast.info('Please sign in to dislike this short');
      navigate('/login');
      return;
    }
    if (!currentShort) return;

    const shortId = currentShort._id;
    const prev = reactions[shortId] || { liked: false, disliked: false, likesCount: 0, dislikesCount: 0 };
    const nextDisliked = !prev.disliked;
    const nextDislikesCount = nextDisliked ? prev.dislikesCount + 1 : Math.max(0, prev.dislikesCount - 1);
    const nextLiked = nextDisliked ? false : prev.liked;
    const nextLikesCount = nextDisliked && prev.liked ? Math.max(0, prev.likesCount - 1) : prev.likesCount;

    setReactions((all) => ({
      ...all,
      [shortId]: {
        liked: nextLiked,
        disliked: nextDisliked,
        likesCount: nextLikesCount,
        dislikesCount: nextDislikesCount,
      },
    }));

    try {
      const { data } = await API.post(`/likes/${shortId}/dislike`);
      if (data.success) {
        setReactions((all) => ({
          ...all,
          [shortId]: {
            liked: data.liked,
            disliked: data.disliked,
            likesCount: data.likesCount,
            dislikesCount: data.dislikesCount,
          },
        }));
      }
    } catch (err) {
      setReactions((all) => ({ ...all, [shortId]: prev }));
      toast.error('Could not update dislike');
    }
  };

  // Creator Subscribe
  const isOwner = user && currentShort?.uploader && user._id === currentShort.uploader._id;
  const isSubscribed = currentShort?.uploader?._id ? !!subMap[currentShort.uploader._id] : false;

  const handleSubscribe = async () => {
    if (!user) {
      toast.info('Please sign in to subscribe');
      navigate('/login');
      return;
    }
    if (isOwner) {
      toast.warning('You cannot subscribe to your own channel');
      return;
    }
    if (subLoading || !currentShort?.uploader?._id) return;

    try {
      setSubLoading(true);
      const uId = currentShort.uploader._id;
      const { data } = await API.post(`/subscriptions/${uId}`);
      if (data.success) {
        setSubMap((prev) => ({ ...prev, [uId]: data.subscribed }));
        toast.success(data.message);
      }
    } catch (err) {
      toast.error('Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  // Share Short
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Short link copied to clipboard');
  };

  // Save Short to Watch Later
  const handleSave = () => {
    if (!currentShort) return;
    try {
      const stored = JSON.parse(localStorage.getItem('cineplay_watch_later') || '[]');
      if (!stored.some((v) => v._id === currentShort._id)) {
        stored.unshift(currentShort);
        localStorage.setItem('cineplay_watch_later', JSON.stringify(stored));
        toast.success('Saved to Watch Later');
      } else {
        toast.info('Already in Watch Later');
      }
    } catch {
      toast.success('Saved to Watch Later');
    }
  };

  // Comments inside Drawer
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to post a comment');
      navigate('/login');
      return;
    }
    if (!commentText.trim() || !currentShort) return;

    try {
      setCommentSubmitting(true);
      const { data } = await API.post(`/comments/${currentShort._id}`, { text: commentText });
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText('');
        toast.success('Comment posted');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) {
      toast.info('Sign in to react to comments');
      navigate('/login');
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const wasLiked = !!c.isLiked;
        const wasDisliked = !!c.isDisliked;
        const nextLiked = !wasLiked;
        const nextLikesCount = nextLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1);
        const nextDisliked = nextLiked ? false : wasDisliked;
        const nextDislikesCount = nextLiked && wasDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : c.dislikesCount || 0;
        return {
          ...c,
          isLiked: nextLiked,
          isDisliked: nextDisliked,
          likesCount: nextLikesCount,
          dislikesCount: nextDislikesCount,
        };
      })
    );

    try {
      const { data } = await API.post(`/comments/${commentId}/like`);
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  isLiked: data.isLiked,
                  isDisliked: data.isDisliked,
                  likesCount: data.likesCount,
                  dislikesCount: data.dislikesCount,
                }
              : c
          )
        );
      }
    } catch (err) {
      toast.error('Failed to update comment reaction');
    }
  };

  const handleCommentDislike = async (commentId) => {
    if (!user) {
      toast.info('Sign in to react to comments');
      navigate('/login');
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const wasLiked = !!c.isLiked;
        const wasDisliked = !!c.isDisliked;
        const nextDisliked = !wasDisliked;
        const nextDislikesCount = nextDisliked ? (c.dislikesCount || 0) + 1 : Math.max(0, (c.dislikesCount || 0) - 1);
        const nextLiked = nextDisliked ? false : wasLiked;
        const nextLikesCount = nextDisliked && wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : c.likesCount || 0;
        return {
          ...c,
          isLiked: nextLiked,
          isDisliked: nextDisliked,
          likesCount: nextLikesCount,
          dislikesCount: nextDislikesCount,
        };
      })
    );

    try {
      const { data } = await API.post(`/comments/${commentId}/dislike`);
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  isLiked: data.isLiked,
                  isDisliked: data.isDisliked,
                  likesCount: data.likesCount,
                  dislikesCount: data.dislikesCount,
                }
              : c
          )
        );
      }
    } catch (err) {
      toast.error('Failed to update comment reaction');
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const { data } = await API.delete(`/comments/${commentToDelete}`);
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
        toast.success('Comment deleted');
      }
    } catch (err) {
      toast.error('Failed to delete comment');
    } finally {
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="shorts-page-container loading-state">
        <div className="spinner"></div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="shorts-page-container empty-state">
        <div className="shorts-empty-box">
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>⚡</div>
          <h2 className="font-serif">No Shorts Yet</h2>
          <p>Be the first creator to share a short vertical video with the CinePlay community!</p>
          <Link to="/upload?type=short" className="btn-gold" style={{ marginTop: 22, display: 'inline-block' }}>
            Upload a Short
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="shorts-page-container fade-in"
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* CinePlay Shorts Desktop 2-Column Area */}
      <div className="shorts-main-desktop-layout">
        {/* Left Column: Center Stage (Header, 9:16 Reel, Action Rail, Metadata, Navigation) */}
        <div className="shorts-center-stage">
          {/* Header Title: ⚡ Shorts */}
          <div className="shorts-stage-header">
            <span className="shorts-header-bolt">⚡</span>
            <h1 className="shorts-header-title">Shorts</h1>
          </div>

          {/* Center Reel Wrapper */}
          <div className="shorts-reel-suite">
            {/* 9:16 Vertical Video Reel Container */}
            <div className="shorts-vertical-reel-box" onClick={handleVideoTap}>
              <video
                ref={videoRef}
                key={currentShort._id}
                src={currentShort.videoFile?.url}
                poster={currentShort.thumbnail?.url}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="shorts-reel-video"
              />

              {/* Floating Double-Tap Heart Reaction Animation */}
              {showHeartAnim && (
                <div className="shorts-floating-heart-reaction">
                  <svg viewBox="0 0 24 24" fill="#D6AD62" width="76" height="76">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}

              {/* Single Click Play/Pause Icon Pulse */}
              {showCenterIcon && (
                <div className="shorts-center-icon-pulse">
                  {showCenterIcon === 'play' ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  )}
                </div>
              )}

              {/* Top Controls Overlay inside video */}
              <div className="shorts-top-video-overlay" onClick={(e) => e.stopPropagation()}>
                {/* Pause / Play Indicator Top-Left */}
                <button className="reel-overlay-icon-btn" onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  )}
                </button>

                <div className="shorts-top-actions">
                  <button
                    className="reel-overlay-icon-btn sound-btn"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>

                  <button className="reel-overlay-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* In-Reel Bottom Info Overlay (YouTube Shorts Style - Compact 10-15% height) */}
              <div className="shorts-reel-info-overlay shorts-below-reel-info" onClick={(e) => e.stopPropagation()}>
                {/* Creator Row: Avatar, Name with Verified Badge ✓, Subs Count, Subscribe Button */}
                <div className="below-creator-row">
                  <Link to={`/channel/${currentShort.uploader?._id}`} className="below-avatar-anchor">
                    <img
                      src={
                        currentShort.uploader?.avatar?.url ||
                        `https://ui-avatars.com/api/?name=${currentShort.uploader?.username}&background=D6AD62&color=000`
                      }
                      alt={currentShort.uploader?.username}
                      className="below-creator-avatar"
                    />
                  </Link>

                  <div className="below-creator-meta">
                    <Link to={`/channel/${currentShort.uploader?._id}`} className="below-creator-name">
                      <span>{currentShort.uploader?.channelName || currentShort.uploader?.username}</span>
                      <span className="below-verified-badge" title="Verified Creator">✓</span>
                    </Link>
                    <span className="below-meta-dot">•</span>
                    <span className="below-subscriber-count">
                      {formatCount(currentShort.uploader?.subscribersCount || 2600000)} subscribers
                    </span>
                  </div>

                  {!isOwner && (
                    <button
                      className={`btn-gold-subscribe ${isSubscribed ? 'subscribed' : ''}`}
                      onClick={handleSubscribe}
                      disabled={subLoading}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  )}
                </div>

                {/* Short Title & Hashtags Row */}
                <div className="below-title-row">
                  <span className="below-short-title">{currentShort.title}</span>
                  <div className="below-hashtags-row">
                    {currentShort.tags && currentShort.tags.length > 0 ? (
                      currentShort.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="muted-gold-hashtag"
                          onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="muted-gold-hashtag">#nature</span>
                        <span className="muted-gold-hashtag">#travel</span>
                        <span className="muted-gold-hashtag">#explore</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Audio Info Row */}
                <div className="below-audio-row">
                  <span className="audio-music-note">♫</span>
                  <span className="audio-music-title">
                    Original Sound - {currentShort.uploader?.channelName || currentShort.uploader?.username}
                  </span>
                </div>

                {/* Golden Progress Scrubber Bar */}
                <div className="shorts-scrubber-line" onClick={handleScrubberClick}>
                  <div className="shorts-scrubber-progress" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Right-Side Vertical Action Panel (Arranged vertically) */}
            <div className="shorts-action-panel-vertical">
              {/* Creator Profile Picture */}
              <Link
                to={`/channel/${currentShort.uploader?._id}`}
                className="action-creator-avatar-wrap"
                title={`Visit ${currentShort.uploader?.username}'s channel`}
              >
                <img
                  src={
                    currentShort.uploader?.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${currentShort.uploader?.username}&background=D6AD62&color=000`
                  }
                  alt={currentShort.uploader?.username}
                  className="action-creator-avatar"
                />
              </Link>

              {/* Like Button with Count */}
              <div className="action-button-cell">
                <button
                  className={`action-circle-btn ${currentReaction.liked ? 'active-gold' : ''}`}
                  onClick={handleLike}
                  title="Like"
                  aria-label="Like"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={currentReaction.liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    width="22"
                    height="22"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <span className="action-cell-label">{formatCount(currentReaction.likesCount)}</span>
              </div>

              {/* Dislike Button with Label */}
              <div className="action-button-cell">
                <button
                  className={`action-circle-btn ${currentReaction.disliked ? 'active-gold' : ''}`}
                  onClick={handleDislike}
                  title="Dislike"
                  aria-label="Dislike"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={currentReaction.disliked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    width="22"
                    height="22"
                  >
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                  </svg>
                </button>
                <span className="action-cell-label">Dislike</span>
              </div>

              {/* Comments Button with Count */}
              <div className="action-button-cell">
                <button
                  className={`action-circle-btn ${commentsOpen ? 'active-gold' : ''}`}
                  onClick={handleToggleComments}
                  title="Comments"
                  aria-label="Comments"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <span className="action-cell-label">{formatCount(currentShort.commentsCount || comments.length)}</span>
              </div>

              {/* Share Button with Label */}
              <div className="action-button-cell">
                <button className="action-circle-btn" onClick={handleShare} title="Share" aria-label="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <span className="action-cell-label">Share</span>
              </div>

              {/* Save Button with Label */}
              <div className="action-button-cell">
                <button className="action-circle-btn" onClick={handleSave} title="Save to Watch Later" aria-label="Save">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <span className="action-cell-label">Save</span>
              </div>

              {/* Three-Dot Menu Button */}
              <div className="action-button-cell more-menu-anchor" ref={moreMenuRef}>
                <button
                  className="action-circle-btn"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  title="More Options"
                  aria-label="More"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {moreMenuOpen && (
                  <div className="shorts-popover-menu fade-in">
                    <button className="popover-item" onClick={handleShare}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>Copy link</span>
                    </button>
                    <button className="popover-item" onClick={() => toast.info('Report submitted')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      <span>Report</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Vertical Feed Up / Down Navigation Controls */}
            <div className="shorts-nav-arrows">
              <button
                className={`feed-nav-arrow-btn ${currentIndex === 0 ? 'disabled' : ''}`}
                onClick={goToPrev}
                disabled={currentIndex === 0}
                title="Previous Short (Up Arrow)"
                aria-label="Previous Short"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                className={`feed-nav-arrow-btn ${currentIndex === shorts.length - 1 ? 'disabled' : ''}`}
                onClick={goToNext}
                disabled={currentIndex === shorts.length - 1}
                title="Next Short (Down Arrow)"
                aria-label="Next Short"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Independently Scrollable Recommended Shorts Panel */}
        <aside className="shorts-right-recommendations" ref={rightFeedRef}>
          <div className="rec-shorts-header">
            <span className="rec-shorts-title">More Shorts</span>
          </div>

          <div className="rec-shorts-stack">
            {shorts.map((item, idx) => {
              const isSelected = item._id === currentShort._id;
              const mockDuration = item.videoFile?.duration || [32, 28, 30, 25, 26, 34, 18, 22][idx % 8];

              return (
                <div
                  key={item._id}
                  className={`rec-short-card ${isSelected ? 'active-playing' : ''}`}
                  onClick={() => selectShortById(item._id)}
                >
                  <div className="rec-short-thumb-wrapper">
                    <img
                      src={
                        item.thumbnail?.url ||
                        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop'
                      }
                      alt={item.title}
                      className="rec-short-thumb"
                    />
                    <span className="rec-short-duration-badge">0:{mockDuration < 10 ? `0${mockDuration}` : mockDuration}</span>
                  </div>

                  <div className="rec-short-meta">
                    <h4 className="rec-short-title">{item.title}</h4>
                    <span className="rec-short-views">{formatCount(item.views || 1800000)} views</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Slide-over Comments Panel */}
      {commentsOpen && (
        <div className="shorts-comments-drawer-backdrop" onClick={handleToggleComments}>
          <div className="shorts-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-drag-pill" />
            <div className="drawer-header">
              <div className="drawer-title-group">
                <h3>Comments</h3>
                <span className="drawer-comments-count">{formatCount(comments.length)}</span>
              </div>
              <button className="drawer-close-btn" onClick={handleToggleComments} aria-label="Close Comments">
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="drawer-comments-stream">
              {loadingComments ? (
                <div className="drawer-loading">
                  <div className="spinner"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="drawer-empty-slate">
                  <p>No comments yet on this short reel. Be the first to share your reaction!</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isAuthor = user && comment.author && user._id === comment.author._id;
                  const canDelete = isAuthor || isOwner;

                  return (
                    <div key={comment._id} className="drawer-comment-item fade-in">
                      <Link to={`/channel/${comment.author?._id}`}>
                        <img
                          src={
                            comment.author?.avatar?.url ||
                            `https://ui-avatars.com/api/?name=${comment.author?.username}&background=D6AD62&color=000`
                          }
                          alt={comment.author?.username}
                          className="drawer-comment-avatar"
                        />
                      </Link>

                      <div className="drawer-comment-content">
                        <div className="drawer-comment-meta">
                          <Link to={`/channel/${comment.author?._id}`} className="drawer-comment-author">
                            @{comment.author?.username}
                          </Link>
                          <span className="drawer-comment-time">{formatDistanceToNow(comment.createdAt)}</span>
                          {canDelete && (
                            <button
                              className="drawer-comment-del"
                              onClick={() => setCommentToDelete(comment._id)}
                              title="Delete comment"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <p className="drawer-comment-text">{comment.text}</p>

                        <div className="drawer-comment-reactions">
                          <button
                            className={`drawer-react-btn ${comment.isLiked ? 'liked' : ''}`}
                            onClick={() => handleCommentLike(comment._id)}
                            title="Like comment"
                          >
                            <svg viewBox="0 0 24 24" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                            {comment.likesCount > 0 && <span>{formatCount(comment.likesCount)}</span>}
                          </button>

                          <button
                            className={`drawer-react-btn ${comment.isDisliked ? 'disliked' : ''}`}
                            onClick={() => handleCommentDislike(comment._id)}
                            title="Dislike comment"
                          >
                            <svg viewBox="0 0 24 24" fill={comment.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                            </svg>
                            {comment.dislikesCount > 0 && <span>{formatCount(comment.dislikesCount)}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Post Form */}
            <div className="drawer-bottom-input-tray">
              {user ? (
                <form onSubmit={handleCommentSubmit} className="drawer-input-form">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="drawer-comment-input"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentSubmitting}
                    className="drawer-comment-submit-btn"
                  >
                    Post
                  </button>
                </form>
              ) : (
                <div className="drawer-signin-prompt">
                  <span>Sign in to post a comment</span>
                  <Link to="/login" className="btn-gold" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Comment Deletion */}
      <ConfirmModal
        isOpen={!!commentToDelete}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};

export default Shorts;
