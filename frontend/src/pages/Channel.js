import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { formatCount } from '../utils/helpers';
import { toast } from 'react-toastify';
import './Channel.css';

const Channel = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  // Subscription state
  const [subscribed, setSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  const fetchChannelData = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, videosRes] = await Promise.all([
        API.get(`/users/${id}`),
        API.get(`/videos/user/${id}?limit=100`)
      ]);

      if (userRes.data.success) {
        setChannel(userRes.data.user);
        setSubscribersCount(userRes.data.user.subscribersCount || 0);
      }
      if (videosRes.data.success) {
        setVideos(videosRes.data.videos || []);
      }
    } catch (err) {
      toast.error('Failed to load channel details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkSub = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await API.get(`/subscriptions/check/${id}`);
      if (data.success) {
        setSubscribed(data.subscribed);
      }
      const countRes = await API.get(`/subscriptions/count/${id}`);
      if (countRes.data.success) {
        setSubscribersCount(countRes.data.count);
      }
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchChannelData();
    checkSub();
    window.scrollTo(0, 0);
  }, [fetchChannelData, checkSub]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.info('Please sign in to subscribe to channels');
      return;
    }
    if (isOwner) {
      toast.warning('You cannot subscribe to your own channel');
      return;
    }
    try {
      setSubLoading(true);
      const { data } = await API.post(`/subscriptions/${id}`);
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

  const isOwner = user && channel && user._id === channel._id;

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="empty-cinema-slate" style={{ marginTop: 40 }}>
        <div className="empty-symbol font-serif">🎭</div>
        <h2 className="font-serif">Channel Not Found</h2>
        <p>The creator channel or directorial catalog you requested does not exist.</p>
        <Link to="/" className="btn-gold" style={{ display: 'inline-flex', marginTop: 8 }}>
          Return to Cinema Home
        </Link>
      </div>
    );
  }

  return (
    <div className="channel-page fade-in">
      {/* Banner */}
      <div
        className="channel-banner"
        style={{
          backgroundImage: channel.channelBanner?.url
            ? `url(${channel.channelBanner.url})`
            : 'linear-gradient(135deg, #0B0B0B 0%, #171717 50%, #202020 100%)'
        }}
      />

      {/* Header Info */}
      <div className="channel-header-container">
        <div className="channel-header-main">
          <img
            src={channel.avatar?.url || `https://ui-avatars.com/api/?name=${channel.username}&background=D6AD62&color=000&size=120`}
            alt={channel.username}
            className="channel-large-avatar"
          />
          <div className="channel-meta-details">
            <h1 className="channel-display-name">{channel.channelName || channel.username}</h1>
            <div className="channel-tags-row">
              <span className="channel-handle">@{channel.username}</span>
              <span>·</span>
              <span>{formatCount(subscribersCount)} subscribers</span>
              <span>·</span>
              <span>{videos.length} {videos.length === 1 ? 'title' : 'titles'}</span>
            </div>
            {channel.channelDescription && (
              <p className="channel-bio-preview">{channel.channelDescription}</p>
            )}
          </div>
        </div>

        {/* Subscribe or Edit Channel */}
        <div className="channel-action-right">
          {isOwner ? (
            <Link to="/settings" className="btn-manage-channel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              Customize Channel
            </Link>
          ) : (
            <button
              className={`btn-channel-sub ${subscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="channel-tabs-bar">
        <button
          className={`channel-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos ({videos.length})
        </button>
        <button
          className={`channel-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      <div className="channel-content-area">
        {activeTab === 'videos' && (
          videos.length > 0 ? (
            <div className="discovery-grid">
              {videos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>
          ) : (
            <div className="empty-cinema-slate">
              <div className="empty-symbol font-serif">📹</div>
              <h3 className="font-serif">No Videos Uploaded Yet</h3>
              <p>
                {isOwner
                  ? 'Your channel is ready. Upload your first video or short!'
                  : 'This creator has not uploaded any videos yet. Subscribe to get notified of new uploads.'}
              </p>
              {isOwner && (
                <Link to="/upload" className="btn-gold" style={{ display: 'inline-flex', marginTop: 8 }}>
                  Upload First Video
                </Link>
              )}
            </div>
          )
        )}

        {activeTab === 'about' && (
          <div className="channel-about-card">
            <div className="about-bio-column">
              <h3>About Channel</h3>
              <p className="about-bio-text">
                {channel.channelDescription || 'This creator has not written a channel description yet.'}
              </p>
            </div>

            <div className="about-stats-column">
              <h3>Stats</h3>
              <div className="about-stat-row">
                <span className="about-stat-label">Joined</span>
                <span className="about-stat-val">
                  {new Date(channel.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="about-stat-row">
                <span className="about-stat-label">Total Views</span>
                <span className="about-stat-val">{(channel.totalViews || 0).toLocaleString()}</span>
              </div>
              <div className="about-stat-row">
                <span className="about-stat-label">Total Videos</span>
                <span className="about-stat-val">{videos.length}</span>
              </div>
              <div className="about-stat-row">
                <span className="about-stat-label">Subscribers</span>
                <span className="about-stat-val">{(subscribersCount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
