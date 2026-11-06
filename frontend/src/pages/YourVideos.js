import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { formatCount, formatDuration, timeAgo } from '../utils/helpers';
import { toast } from 'react-toastify';
import './YourVideos.css';

const YourVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [targetVideo, setTargetVideo] = useState(null);

  const fetchVideos = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const { data } = await API.get(`/videos/user/${user._id}?limit=100`);
      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your video catalog');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleConfirmDelete = async () => {
    if (!targetVideo) return;
    try {
      setDeletingId(targetVideo._id);
      const { data } = await API.delete(`/videos/${targetVideo._id}`);
      if (data.success) {
        toast.success('Title removed from catalog');
        setVideos((prev) => prev.filter((v) => v._id !== targetVideo._id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete title');
    } finally {
      setDeletingId(null);
      setTargetVideo(null);
    }
  };

  // Calculations for studio metrics
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.likesCount || 0), 0);
  const totalComments = videos.reduce((acc, v) => acc + (v.commentsCount || 0), 0);

  return (
    <div className="studio-page-container fade-in">
      {/* Header */}
      <div className="studio-header">
        <div>
          <span className="studio-tagline">STUDIO CREATOR SUITE</span>
          <h1 className="studio-title">Your Creator Studio</h1>
          <p className="studio-subtitle">
            Manage your uploaded videos and shorts, track audience engagement, and publish new content.
          </p>
        </div>

        <Link to="/upload" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Upload New Video</span>
        </Link>
      </div>

      {/* Analytics Highlights */}
      <div className="studio-stats-grid">
        <div className="studio-stat-card">
          <div className="stat-label">Uploaded Videos</div>
          <div className="stat-value">{videos.length}</div>
          <div className="stat-subtext">Active Videos & Shorts</div>
        </div>

        <div className="studio-stat-card">
          <div className="stat-label">Total Views</div>
          <div className="stat-value">{formatCount(totalViews)}</div>
          <div className="stat-subtext">Audience Impressions</div>
        </div>

        <div className="studio-stat-card">
          <div className="stat-label">Total Likes</div>
          <div className="stat-value">{formatCount(totalLikes)}</div>
          <div className="stat-subtext">Viewer Likes</div>
        </div>

        <div className="studio-stat-card">
          <div className="stat-label">Comments</div>
          <div className="stat-value">{formatCount(totalComments)}</div>
          <div className="stat-subtext">Community Discussions</div>
        </div>
      </div>

      {/* Video Catalog */}
      <div className="studio-catalog-card">
        <div className="catalog-table-header">
          <h2>Your Videos ({videos.length})</h2>
          <span className="catalog-count-pill">
            {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="studio-table-responsive">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>Video & Title</th>
                  <th>Category</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((vid) => (
                  <tr key={vid._id}>
                    <td>
                      <div className="video-cell">
                        <Link to={`/watch/${vid._id}`} className="video-thumb-link">
                          <img
                            src={vid.thumbnail?.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80'}
                            alt={vid.title}
                            className="video-thumb-img"
                          />
                          {(vid.videoFile?.duration || vid.duration) > 0 && (
                            <span className="duration-chip">{formatDuration(vid.videoFile?.duration || vid.duration)}</span>
                          )}
                        </Link>
                        <div className="video-cell-meta">
                          <Link to={`/watch/${vid._id}`} className="video-cell-title" title={vid.title}>
                            {vid.title}
                          </Link>
                          <span className="video-cell-category">{vid.category || 'Cinema'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {vid.category || 'Film'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCount(vid.views || 0)}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatCount(vid.likesCount || 0)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {timeAgo(vid.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <Link
                          to={`/watch/${vid._id}`}
                          className="action-icon-btn"
                          title="Watch Title"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </Link>

                        <Link
                          to={`/upload?edit=${vid._id}`}
                          className="action-icon-btn"
                          title="Edit Details"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          title="Delete Video"
                          disabled={deletingId === vid._id}
                          onClick={() => setTargetVideo(vid)}
                        >
                          {deletingId === vid._id ? (
                            <span style={{ fontSize: '0.7rem' }}>...</span>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '70px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📹</div>
            <h3 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 8 }}>
              No Videos in Your Channel Yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 460, margin: '0 auto 24px' }}>
              Your channel is ready for your content. Upload your first video or short to start building an audience.
            </p>
            <Link to="/upload" className="btn-gold">
              Upload Your First Video
            </Link>
          </div>
        )}
      </div>
      {/* Custom Confirmation Popup Modal */}
      <ConfirmModal
        isOpen={!!targetVideo}
        title="Delete Video?"
        message={`Are you certain you wish to delete "${targetVideo?.title}"? This video will be permanently removed from CinePlay and cannot be reversed.`}
        confirmText="Delete Video"
        cancelText="Cancel"
        variant="danger"
        loading={!!deletingId}
        onConfirm={handleConfirmDelete}
        onClose={() => !deletingId && setTargetVideo(null)}
      />
    </div>
  );
};

export default YourVideos;

