import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api/axios';
import VideoCard from '../components/VideoCard';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) {
        setVideos([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data } = await API.get('/videos/search', { params: { q: query } });
        if (data.success) {
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [query]);

  return (
    <div className="search-page-container fade-in">
      <div className="search-header">
        <span className="search-badge">SEARCH RESULTS</span>
        <h1 className="search-title font-serif">
          Results for <span className="search-highlight">"{query}"</span>
        </h1>
        <p className="search-count">
          {videos.length} video{videos.length === 1 ? '' : 's'} found
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
          <div className="empty-symbol font-serif">🔍</div>
          <h3 className="font-serif">No Videos Found</h3>
          <p>We couldn't locate any videos or shorts matching "{query}". Try searching for alternative keywords or creators.</p>
          <Link to="/" className="btn-gold" style={{ display: 'inline-flex', marginTop: 8 }}>
            Browse Home Videos
          </Link>
        </div>
      )}
    </div>
  );
};

export default Search;
