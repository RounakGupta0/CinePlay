import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

const Library = () => {
  const { user } = useAuth();
  const [likedVideos, setLikedVideos] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [watchLaterItems, setWatchLaterItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        setLoading(true);
        if (user) {
          const { data } = await API.get('/likes/feed/me');
          if (data.success) {
            setLikedVideos(data.videos || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();

    try {
      setHistoryItems(JSON.parse(localStorage.getItem('cineplay_history') || '[]'));
      setWatchLaterItems(JSON.parse(localStorage.getItem('cineplay_watch_later') || '[]'));
    } catch {}
  }, [user]);

  return (
    <div className="fade-in" style={{ paddingBottom: 72 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold-primary)' }}>
          ARCHIVE
        </span>
        <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
          Your Library
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Personal vault of saved videos, viewing history, and liked content
        </p>
      </div>

      {/* Watch Later Section */}
      <section style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            Watch Later ({watchLaterItems.length})
          </h2>
          <Link to="/watch-later" className="section-more-link">
            <span>View All</span>
          </Link>
        </div>

        {watchLaterItems.length > 0 ? (
          <div className="discovery-grid">
            {watchLaterItems.slice(0, 4).map((vid) => (
              <VideoCard key={`lib-wl-${vid._id}`} video={vid} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No videos saved in Watch Later.</p>
        )}
      </section>

      {/* Liked Videos Section */}
      <section style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            Liked Videos ({likedVideos.length})
          </h2>
          <Link to="/liked" className="section-more-link">
            <span>View All</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : likedVideos.length > 0 ? (
          <div className="discovery-grid">
            {likedVideos.slice(0, 4).map((vid) => (
              <VideoCard key={`lib-liked-${vid._id}`} video={vid} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {user ? 'No liked videos yet.' : 'Sign in to access your liked videos.'}
          </p>
        )}
      </section>

      {/* History Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            Recently Watched ({historyItems.length})
          </h2>
          <Link to="/history" className="section-more-link">
            <span>View Full History</span>
          </Link>
        </div>

        {historyItems.length > 0 ? (
          <div className="discovery-grid">
            {historyItems.slice(0, 4).map((vid) => (
              <VideoCard key={`lib-hist-${vid._id}`} video={vid} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recently watched videos recorded.</p>
        )}
      </section>
    </div>
  );
};

export default Library;
