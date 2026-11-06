import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, formatCount, formatDuration } from '../utils/helpers';
import { toast } from 'react-toastify';
import './VideoCard.css';

const VideoCard = ({ video, progressPercent }) => {
  const { _id, title, thumbnail, uploader, views, createdAt } = video;
  const videoDuration = video.videoFile?.duration || video.duration || 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
    setMenuOpen(false);
  };

  const handleSaveWatchLater = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = JSON.parse(localStorage.getItem('cineplay_watch_later') || '[]');
      if (!stored.some(v => v._id === _id)) {
        stored.unshift(video);
        localStorage.setItem('cineplay_watch_later', JSON.stringify(stored));
        toast.success('Saved to Watch Later');
      } else {
        toast.info('Already in Watch Later');
      }
    } catch {
      toast.success('Saved to Watch Later');
    }
    setMenuOpen(false);
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="cineplay-video-card">
      {/* Thumbnail Area */}
      <Link to={`/watch/${_id}`} className="card-thumb-container">
        <img
          src={thumbnail?.url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&h=720&fit=crop'}
          alt={title}
          className="card-thumb-img"
          loading="lazy"
        />

        {/* Duration Badge */}
        {videoDuration > 0 && (
          <span className="card-duration-badge">{formatDuration(videoDuration)}</span>
        )}

        {/* Cinematic Play Overlay on Hover */}
        <div className="card-hover-overlay">
          <div className="golden-play-pill">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
              <polygon points="6 4 19 12 6 20 6 4" />
            </svg>
            <span>Play</span>
          </div>
        </div>

        {/* Optional Continue Watching Progress Bar */}
        {typeof progressPercent === 'number' && (
          <div className="card-progress-track">
            <div className="card-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </Link>

      {/* Meta & Info Area */}
      <div className="card-meta-row">
        {/* Creator Avatar */}
        <Link to={`/channel/${uploader?._id}`} className="card-creator-avatar-wrap">
          <img
            src={uploader?.avatar?.url || `https://ui-avatars.com/api/?name=${uploader?.username || 'C'}&background=D6AD62&color=000`}
            alt={uploader?.username}
            className="card-creator-avatar"
          />
        </Link>

        {/* Text Details */}
        <div className="card-text-col">
          <div className="card-title-header">
            <Link to={`/watch/${_id}`} className="card-video-title" title={title}>
              {title}
            </Link>

            {/* Three-dot menu for additional actions */}
            <div className="card-menu-container" ref={menuRef}>
              <button
                className="card-dots-btn"
                onClick={toggleMenu}
                aria-label="More options"
                title="Options"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="card-dropdown-menu fade-in">
                  <button className="card-dropdown-item" onClick={handleSaveWatchLater}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                      <circle cx="12" cy="12" r="9"/>
                      <polyline points="12 6 12 12 16 12"/>
                    </svg>
                    Save to Watch Later
                  </button>
                  <button className="card-dropdown-item" onClick={handleCopyLink}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>

          <Link to={`/channel/${uploader?._id}`} className="card-channel-name">
            {uploader?.channelName || uploader?.username}
          </Link>

          <div className="card-analytics-line">
            <span>{formatCount(views)} views</span>
            <span className="dot-divider">·</span>
            <span>{formatDistanceToNow(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
