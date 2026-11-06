import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import VideoCard from '../components/VideoCard';
import { Link } from 'react-router-dom';

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/likes/feed/me');
        if (data.success) {
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiked();
  }, []);

  return (
    <div className="fade-in" style={{ paddingBottom: 72 }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold-primary)' }}>
          YOUR LIKES
        </span>
        <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
          Liked Videos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Videos and shorts you have liked on CinePlay.
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
          <div className="empty-symbol font-serif">✨</div>
          <h3 className="font-serif">No Liked Videos Yet</h3>
          <p>When you like a video or short, it will appear here in your personal collection.</p>
          <Link to="/" className="btn-gold" style={{ display: 'inline-flex', marginTop: 8 }}>
            Discover Videos
          </Link>
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
