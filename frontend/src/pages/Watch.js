import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, formatCount } from '../utils/helpers';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const playerEnclosureRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom Video Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(null); // 'play' | 'pause'
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrubHoverTime, setScrubHoverTime] = useState(null);
  const [scrubHoverX, setScrubHoverX] = useState(0);

  // Likes & Dislike state
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [dislikeLoading, setDislikeLoading] = useState(false);

  // Subscription state
  const [subscribed, setSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  // Description & More Options
  const [showDescMore, setShowDescMore] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const moreOptionsRef = useRef(null);
  const settingsRef = useRef(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsSort, setCommentsSort] = useState('top');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Recommended videos state & category filter
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [activeRecFilter, setActiveRecFilter] = useState('all'); // 'all' | 'creator' | 'recent'

  // Time formatter: "5:24 / 18:37"
  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const totalSecs = Math.floor(secs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remainingM = m % 60;
      return `${h}:${remainingM < 10 ? '0' : ''}${remainingM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) {
        setMoreOptionsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Controls auto-hide timer
  const handleUserActivity = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setSettingsOpen(false);
      }, 2800);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  // Fetch Video details
  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/videos/${id}`);
      if (data.success) {
        setVideo(data.video);
        setLikesCount(data.video.likesCount || 0);
        setDislikesCount(data.video.dislikesCount || 0);
        setSubscribersCount(data.video.uploader?.subscribersCount || 0);

        fetchRecommendations(data.video.category, data.video._id);

        try {
          const history = JSON.parse(localStorage.getItem('cineplay_history') || '[]');
          const filtered = history.filter((h) => h._id !== data.video._id);
          filtered.unshift({
            ...data.video,
            watchedAt: new Date().toISOString(),
          });
          localStorage.setItem('cineplay_history', JSON.stringify(filtered.slice(0, 30)));
        } catch {}
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRecommendations = async (category, currentId) => {
    try {
      const { data } = await API.get('/videos', {
        params: { limit: 16, sort: 'popular' },
      });
      if (data.success) {
        setRecommendedVideos(data.videos.filter((v) => v._id !== currentId));
      }
    } catch (err) {
      console.error('Recommendations error:', err);
    }
  };

  const fetchLikeStatus = useCallback(async () => {
    try {
      const { data } = await API.get(`/likes/${id}`);
      if (data.success) {
        setLiked(data.liked);
        setDisliked(data.disliked);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
      }
    } catch (err) {
      console.error('Like check error:', err);
    }
  }, [id]);

  const fetchSubStatus = useCallback(async (uploaderId) => {
    if (!uploaderId) return;
    try {
      const { data } = await API.get(`/subscriptions/check/${uploaderId}`);
      if (data.success) {
        setSubscribed(data.subscribed);
      }
      const countRes = await API.get(`/subscriptions/count/${uploaderId}`);
      if (countRes.data.success) {
        setSubscribersCount(countRes.data.count);
      }
    } catch (err) {
      console.error('Sub check error:', err);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await API.get(`/comments/${id}`);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Comments fetch error:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
    fetchComments();
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }, [fetchVideo, fetchComments]);

  useEffect(() => {
    if (video) {
      fetchLikeStatus();
      if (video.uploader?._id) {
        fetchSubStatus(video.uploader._id);
      }
    }
  }, [video, fetchLikeStatus, fetchSubStatus]);

  // Video Element event listeners
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / (videoRef.current.duration || 1)) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur || video?.videoFile?.duration || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setControlsVisible(true);
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

  // Scrubber / Seek
  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const handleScrubMouseMove = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubHoverTime(pos * duration);
    setScrubHoverX(e.clientX - rect.left);
  };

  // Volume
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Playback speed
  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSettingsOpen(false);
    toast.info(`Playback speed: ${speed}x`);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!playerEnclosureRef.current) return;
    if (!document.fullscreenElement) {
      playerEnclosureRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Theater Mode
  const toggleTheaterMode = () => {
    setTheaterMode((prev) => !prev);
  };

  // Like & Dislike
  const handleLike = async () => {
    if (!user) {
      toast.info('Please sign in to like this title');
      navigate('/login');
      return;
    }
    if (likeLoading) return;

    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikesCount = likesCount;
    const prevDislikesCount = dislikesCount;

    const nextLiked = !prevLiked;
    const nextLikesCount = nextLiked ? prevLikesCount + 1 : Math.max(0, prevLikesCount - 1);
    const nextDisliked = nextLiked ? false : prevDisliked;
    const nextDislikesCount = nextLiked && prevDisliked ? Math.max(0, prevDislikesCount - 1) : prevDislikesCount;

    setLiked(nextLiked);
    setDisliked(nextDisliked);
    setLikesCount(nextLikesCount);
    setDislikesCount(nextDislikesCount);

    try {
      setLikeLoading(true);
      const { data } = await API.post(`/likes/${id}`);
      if (data.success) {
        setLiked(data.liked);
        setDisliked(data.disliked);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
      }
    } catch (err) {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikesCount(prevLikesCount);
      setDislikesCount(prevDislikesCount);
      toast.error('Could not update like status');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      toast.info('Please sign in to dislike this title');
      navigate('/login');
      return;
    }
    if (dislikeLoading) return;

    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikesCount = likesCount;
    const prevDislikesCount = dislikesCount;

    const nextDisliked = !prevDisliked;
    const nextDislikesCount = nextDisliked ? prevDislikesCount + 1 : Math.max(0, prevDislikesCount - 1);
    const nextLiked = nextDisliked ? false : prevLiked;
    const nextLikesCount = nextDisliked && prevLiked ? Math.max(0, prevLikesCount - 1) : prevLikesCount;

    setDisliked(nextDisliked);
    setLiked(nextLiked);
    setDislikesCount(nextDislikesCount);
    setLikesCount(nextLikesCount);

    try {
      setDislikeLoading(true);
      const { data } = await API.post(`/likes/${id}/dislike`);
      if (data.success) {
        setLiked(data.liked);
        setDisliked(data.disliked);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
      }
    } catch (err) {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikesCount(prevLikesCount);
      setDislikesCount(prevDislikesCount);
      toast.error('Could not update dislike status');
    } finally {
      setDislikeLoading(false);
    }
  };

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
    if (subLoading) return;
    try {
      setSubLoading(true);
      const { data } = await API.post(`/subscriptions/${video.uploader._id}`);
      if (data.success) {
        setSubscribed(data.subscribed);
        setSubscribersCount(data.subscribersCount);
        toast.success(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  // Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Cinema link copied to clipboard');
  };

  // Save to Watch Later
  const handleSaveWatchLater = () => {
    if (!video) return;
    try {
      const stored = JSON.parse(localStorage.getItem('cineplay_watch_later') || '[]');
      if (!stored.some((v) => v._id === video._id)) {
        stored.unshift(video);
        localStorage.setItem('cineplay_watch_later', JSON.stringify(stored));
        toast.success('Added to Watch Later');
      } else {
        toast.info('Already in Watch Later');
      }
    } catch {
      toast.success('Added to Watch Later');
    }
  };

  // Post Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to comment');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setCommentSubmitting(true);
      const { data } = await API.post(`/comments/${id}`, { text: commentText });
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText('');
        toast.success('Reflection posted');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
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
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setCommentToDelete(null);
    }
  };

  // Filter recommended videos based on active chip
  const filteredRecommendations = recommendedVideos
    .filter((item) => {
      if (activeRecFilter === 'creator') {
        return item.uploader?._id === video?.uploader?._id || item.uploader?.channelName === video?.uploader?.channelName;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeRecFilter === 'recent') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return (b.views || 0) - (a.views || 0);
    });

  // Sorted Comments
  const sortedComments = [...comments].sort((a, b) => {
    if (commentsSort === 'top') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const isOwner = user && video?.uploader && user._id === video.uploader._id;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div className="watch-loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="watch-error-screen">
        <h2 className="font-serif">Title Unavailable</h2>
        <p>{error || 'This cinematic title does not exist or was unlisted.'}</p>
        <Link to="/" className="btn-gold" style={{ marginTop: 20 }}>
          Return to Cinema Home
        </Link>
      </div>
    );
  }

  return (
    <div className={`cineplay-watch-layout fade-in ${theaterMode ? 'theater-layout-active' : ''}`}>
      {/* Left / Primary Column (~72% width) */}
      <div className="watch-primary-stage">
        {/* Large 16:9 Video Player with Custom Dark Luxury Controls */}
        <div
          ref={playerEnclosureRef}
          className={`luxury-player-enclosure ${theaterMode ? 'theater-active' : ''}`}
          onMouseMove={handleUserActivity}
          onMouseLeave={() => isPlaying && setControlsVisible(false)}
        >
          <video
            ref={videoRef}
            src={video.videoFile?.url}
            poster={video.thumbnail?.url}
            autoPlay
            playsInline
            onClick={togglePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="cinema-video-element"
          />

          {/* Center Play/Pause Ripple Indicator */}
          {showCenterIcon && (
            <div className="center-play-indicator">
              {showCenterIcon === 'play' ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </div>
          )}

          {/* Subtitles Overlay Simulation */}
          {subtitlesEnabled && isPlaying && (
            <div className="cinematic-subtitles-caption">
              <span>[CC] &ldquo;{video.title}&rdquo; — Ultra HD Audio Track</span>
            </div>
          )}

          {/* Custom Dark Player Controls Overlay */}
          <div className={`custom-player-controls ${controlsVisible ? 'visible' : 'hidden'}`}>
            {/* Golden Playback Progress Scrubber Bar */}
            <div
              className="player-scrubber-track"
              onClick={handleSeek}
              onMouseMove={handleScrubMouseMove}
              onMouseLeave={() => setScrubHoverTime(null)}
            >
              <div className="scrubber-buffered" style={{ width: `${buffered}%` }} />
              <div className="scrubber-filled" style={{ width: `${progressPercent}%` }} />
              <div className="scrubber-thumb" style={{ left: `${progressPercent}%` }} />

              {scrubHoverTime !== null && (
                <div className="scrubber-tooltip" style={{ left: `${scrubHoverX}px` }}>
                  {formatTime(scrubHoverTime)}
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="controls-bottom-bar">
              {/* Left Group: Play/Pause, Volume, Timestamp */}
              <div className="controls-group-left">
                <button
                  className="ctrl-btn play-pause-btn"
                  onClick={togglePlayPause}
                  title={isPlaying ? 'Pause (k)' : 'Play (k)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  )}
                </button>

                {/* Volume Slider Group */}
                <div className="volume-slider-group">
                  <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted || volume === 0 ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-range-input"
                    aria-label="Volume Slider"
                  />
                </div>

                {/* Timestamp: "5:24 / 18:37" */}
                <div className="player-timestamp">
                  <span className="current-time">{formatTime(currentTime)}</span>
                  <span className="time-divider">/</span>
                  <span className="total-time">{formatTime(duration || 1117)}</span>
                </div>
              </div>

              {/* Right Group: Subtitles, Settings, Theater, Fullscreen */}
              <div className="controls-group-right">
                {/* Subtitles [CC] */}
                <button
                  className={`ctrl-btn cc-btn ${subtitlesEnabled ? 'active-gold' : ''}`}
                  onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                  title="Subtitles / Closed Captions"
                >
                  <span className="cc-text-badge">CC</span>
                </button>

                {/* Settings Gear Popover */}
                <div className="settings-anchor" ref={settingsRef}>
                  <button
                    className={`ctrl-btn ${settingsOpen ? 'active-gold' : ''}`}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    title="Settings"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>

                  {settingsOpen && (
                    <div className="player-settings-popover fade-in">
                      <div className="settings-section-title">Playback Speed</div>
                      <div className="speed-options-grid">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((sp) => (
                          <button
                            key={sp}
                            className={`speed-chip ${playbackSpeed === sp ? 'active' : ''}`}
                            onClick={() => changeSpeed(sp)}
                          >
                            {sp === 1 ? 'Normal' : `${sp}x`}
                          </button>
                        ))}
                      </div>
                      <div className="settings-divider" />
                      <div className="settings-section-title">Quality</div>
                      <div className="quality-pill active">
                        <span>1080p CineHD</span>
                        <span className="gold-check">✓</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Theater Mode Button */}
                <button
                  className={`ctrl-btn ${theaterMode ? 'active-gold' : ''}`}
                  onClick={toggleTheaterMode}
                  title={theaterMode ? 'Default view (t)' : 'Theater mode (t)'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <rect x="4" y="7" width="16" height="10" rx="1" fill={theaterMode ? 'currentColor' : 'none'} />
                  </svg>
                </button>

                {/* Fullscreen Button */}
                <button
                  className="ctrl-btn fullscreen-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}
                >
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Title and Actions Header Row */}
        <div className="watch-header-card">
          <h1 className="watch-film-title font-serif">{video.title}</h1>

          <div className="watch-meta-action-bar">
            {/* Left: Views, Upload Date, Category */}
            <div className="watch-stats-meta-row">
              <span className="meta-views-count">{formatCount(video.views)} views</span>
              <span className="meta-bullet">•</span>
              <span className="meta-date">{formatDistanceToNow(video.createdAt)}</span>
              {video.category && (
                <>
                  <span className="meta-bullet">•</span>
                  <span className="meta-category-badge">{video.category}</span>
                </>
              )}
            </div>

            {/* Right: Actions Suite (Like/Dislike Pill, Share, Save, More) */}
            <div className="watch-actions-suite">
              {/* Like / Dislike Pill Group */}
              <div className="luxury-pill-group">
                <button
                  className={`pill-btn like-pill ${liked ? 'active-gold' : ''}`}
                  onClick={handleLike}
                  disabled={likeLoading}
                  title="Like this video"
                >
                  <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  <span>{formatCount(likesCount)}</span>
                </button>

                <div className="pill-group-divider" />

                <button
                  className={`pill-btn dislike-pill ${disliked ? 'active-gold' : ''}`}
                  onClick={handleDislike}
                  disabled={dislikeLoading}
                  title="Dislike this video"
                >
                  <svg viewBox="0 0 24 24" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                  </svg>
                  {dislikesCount > 0 && <span>{formatCount(dislikesCount)}</span>}
                </button>
              </div>

              {/* Share Button */}
              <button className="luxury-action-pill" onClick={handleShare} title="Share Link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share</span>
              </button>

              {/* Save Button */}
              <button className="luxury-action-pill" onClick={handleSaveWatchLater} title="Save to Watch Later">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Save</span>
              </button>

              {/* More Actions Three-Dot Popover */}
              <div className="more-actions-anchor" ref={moreOptionsRef}>
                <button
                  className="luxury-action-pill more-pill"
                  onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
                  title="More actions"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {moreOptionsOpen && (
                  <div className="luxury-popover-menu fade-in">
                    <button className="popover-item" onClick={handleShare}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>Copy cinema link</span>
                    </button>
                    {isOwner && (
                      <Link to={`/upload?edit=${video._id}`} className="popover-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>Edit Title & Details</span>
                      </Link>
                    )}
                    <button className="popover-item" onClick={() => toast.info('Cinematic report submitted for review.')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      <span>Report Video</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Channel Information Row */}
          <div className="watch-channel-row">
            <div className="channel-profile-left">
              <Link to={`/channel/${video.uploader?._id}`} className="channel-avatar-link">
                <img
                  src={
                    video.uploader?.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${video.uploader?.username}&background=D6AD62&color=000`
                  }
                  alt={video.uploader?.username}
                  className="channel-avatar-circle"
                />
              </Link>
              <div className="channel-text-meta">
                <Link to={`/channel/${video.uploader?._id}`} className="channel-name-link">
                  <span>{video.uploader?.channelName || video.uploader?.username}</span>
                  <span className="creator-verified-badge" title="Verified Creator">✓</span>
                </Link>
                <span className="channel-subscribers-count">
                  {formatCount(subscribersCount)} subscribers
                </span>
              </div>
            </div>

            {/* Subscribe Button */}
            {isOwner ? (
              <span className="owner-badge-pill">Creator Studio</span>
            ) : (
              <button
                className={`btn-gold-subscribe ${subscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
                disabled={subLoading}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Expandable Video Description Card */}
          <div className="watch-synopsis-box">
            <div className={`synopsis-text-content ${showDescMore ? 'expanded' : ''}`}>
              <p>{video.description || 'Experience this cinematic release in full Ultra HD.'}</p>
              {video.tags && video.tags.length > 0 && (
                <div className="synopsis-tags-list">
                  {video.tags.map((tag, idx) => (
                    <span key={idx} className="gold-hashtag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {video.description && video.description.length > 120 && (
              <button
                className="btn-toggle-description"
                onClick={() => setShowDescMore(!showDescMore)}
              >
                {showDescMore ? 'Show less' : '...more'}
              </button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="watch-comments-section">
          <div className="comments-header-row">
            <h3 className="comments-title font-sans">Comments ({formatCount(comments.length)})</h3>

            {/* Sort by Dropdown */}
            <div className="comments-sort-container">
              <button
                className="btn-sort-toggle"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="14" y2="12" />
                  <line x1="4" y1="18" x2="8" y2="18" />
                </svg>
                <span>Sort by</span>
              </button>
              {sortDropdownOpen && (
                <div className="sort-menu-popover fade-in">
                  <button
                    className={`sort-menu-item ${commentsSort === 'top' ? 'active' : ''}`}
                    onClick={() => {
                      setCommentsSort('top');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Top comments
                  </button>
                  <button
                    className={`sort-menu-item ${commentsSort === 'newest' ? 'active' : ''}`}
                    onClick={() => {
                      setCommentsSort('newest');
                      setSortDropdownOpen(false);
                    }}
                  >
                    Newest first
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="comment-input-row">
              <img
                src={
                  user.avatar?.url ||
                  `https://ui-avatars.com/api/?name=${user.username}&background=D6AD62&color=000`
                }
                alt={user.username}
                className="comment-user-avatar"
              />
              <div className="comment-input-box">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="comment-text-field"
                />
                {commentText.trim() && (
                  <div className="comment-form-actions fade-in">
                    <button
                      type="button"
                      className="btn-comment-cancel"
                      onClick={() => setCommentText('')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={commentSubmitting}
                      className="btn-gold"
                      style={{ padding: '6px 18px', fontSize: '0.82rem' }}
                    >
                      {commentSubmitting ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="comment-signin-prompt">
              <span>Sign in to add a comment to this discussion.</span>
              <Link to="/login" className="btn-gold" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                Sign In
              </Link>
            </div>
          )}

          {/* Comment Threads Stream */}
          <div className="comments-threads-list">
            {sortedComments.map((comment) => {
              const isAuthor = user && comment.author && user._id === comment.author._id;
              const canDelete = isAuthor || isOwner;

              return (
                <div key={comment._id} className="comment-card-item fade-in">
                  <Link to={`/channel/${comment.author?._id}`}>
                    <img
                      src={
                        comment.author?.avatar?.url ||
                        `https://ui-avatars.com/api/?name=${comment.author?.username}&background=D6AD62&color=000`
                      }
                      alt={comment.author?.username}
                      className="comment-item-avatar"
                    />
                  </Link>

                  <div className="comment-item-main">
                    <div className="comment-meta-header">
                      <Link to={`/channel/${comment.author?._id}`} className="comment-author-name">
                        @{comment.author?.username}
                      </Link>
                      <span className="comment-date-stamp">{formatDistanceToNow(comment.createdAt)}</span>
                      {canDelete && (
                        <button
                          className="comment-delete-cross"
                          onClick={() => setCommentToDelete(comment._id)}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="comment-body-text">{comment.text}</p>

                    {/* Reactions Bar: Like, Dislike, Reply */}
                    <div className="comment-actions-bar">
                      <button
                        className={`comment-btn-react ${comment.isLiked ? 'liked' : ''}`}
                        onClick={() => handleCommentLike(comment._id)}
                        title="Like"
                      >
                        <svg viewBox="0 0 24 24" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        {comment.likesCount > 0 && <span>{formatCount(comment.likesCount)}</span>}
                      </button>

                      <button
                        className={`comment-btn-react ${comment.isDisliked ? 'disliked' : ''}`}
                        onClick={() => handleCommentDislike(comment._id)}
                        title="Dislike"
                      >
                        <svg viewBox="0 0 24 24" fill={comment.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                        </svg>
                        {comment.dislikesCount > 0 && <span>{formatCount(comment.dislikesCount)}</span>}
                      </button>

                      <button className="comment-reply-btn" onClick={() => toast.info('Reply thread opening...')}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="empty-comments-box">
                <p>No comments yet. Be the first to share your perspective on this title.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Recommended Videos (~28% width) */}
      <aside className="watch-side-recommendations">
        {/* Category Filter Chips: All, From CinePlay, Recently Uploaded */}
        <div className="rec-filter-chips-row">
          <button
            className={`rec-filter-chip ${activeRecFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveRecFilter('all')}
          >
            All
          </button>
          <button
            className={`rec-filter-chip ${activeRecFilter === 'creator' ? 'active' : ''}`}
            onClick={() => setActiveRecFilter('creator')}
          >
            From CinePlay
          </button>
          <button
            className={`rec-filter-chip ${activeRecFilter === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveRecFilter('recent')}
          >
            Recently Uploaded
          </button>
        </div>

        {/* Compact Recommended Video Cards List */}
        <div className="rec-cards-list">
          {filteredRecommendations.map((item, index) => {
            // Mock realistic duration badge if duration is 0
            const durationSecs = item.videoFile?.duration || [862, 738, 1005, 930, 840, 1120][index % 6];
            return (
              <div key={item._id} className="rec-card-item">
                <Link to={`/watch/${item._id}`} className="rec-card-thumb-link">
                  <div className="rec-thumb-container">
                    <img
                      src={
                        item.thumbnail?.url ||
                        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop'
                      }
                      alt={item.title}
                      className="rec-thumb-image"
                    />
                    <span className="rec-duration-badge">{formatTime(durationSecs)}</span>
                  </div>
                </Link>

                <div className="rec-card-info">
                  <Link to={`/watch/${item._id}`} className="rec-card-title-link">
                    <h4 className="rec-card-title">{item.title}</h4>
                  </Link>

                  <div className="rec-card-channel-row">
                    <span className="rec-channel-name">
                      {item.uploader?.channelName || item.uploader?.username || 'CinePlay'}
                    </span>
                    <span className="rec-verified-dot" title="Verified">✓</span>
                  </div>

                  <div className="rec-card-stats-row">
                    <span>{formatCount(item.views)} views</span>
                    <span className="rec-stat-dot">•</span>
                    <span>{formatDistanceToNow(item.createdAt)}</span>
                  </div>
                </div>

                {/* Card Context Menu Button ⋮ */}
                <button
                  className="rec-card-menu-btn"
                  onClick={() => toast.info('Added to queue')}
                  title="More options"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Confirmation Modal for Comment Deletion */}
      <ConfirmModal
        isOpen={!!commentToDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be reversed."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};

export default Watch;
