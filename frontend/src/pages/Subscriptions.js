import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import VideoCard from '../components/VideoCard';
import { Link } from 'react-router-dom';

const Subscriptions = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribed = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/subscriptions/feed');
        if (data.success) {
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribed();
  }, []);

  return (
    <div className="fade-in" style={{ paddingBottom: 72 }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold-primary)' }}>
          SUBSCRIBED CHANNELS
        </span>
        <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
          Subscriptions Feed
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Latest videos and short clips from creators and channels you follow.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : videos.length > 0 ? (
        <div className="discovery-grid">
          {videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      ) : (
        <div className="empty-cinema-slate">
          <div className="empty-symbol font-serif">📺</div>
          <h3 className="font-serif">Your Subscriptions Feed is Empty</h3>
          <p>Subscribe to channels and creators to receive their latest uploads right here.</p>
          <Link to="/" className="btn-gold" style={{ display: 'inline-flex', marginTop: 8 }}>
            Explore Channels & Videos
          </Link>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
