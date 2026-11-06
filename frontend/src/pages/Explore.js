import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import VideoCard from '../components/VideoCard';
import './Explore.css';

const GENRES = [
  'All',
  'Shorts',
  'Gaming',
  'Music',
  'Technology',
  'Entertainment',
  'Education',
  'Comedy',
  'Vlogs'
];

const Explore = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        setLoading(true);
        const params = { limit: 30 };
        if (selectedGenre !== 'All') {
          params.category = selectedGenre;
        }
        const { data } = await API.get('/videos', { params });
        if (data.success) {
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, [selectedGenre]);

  return (
    <div className="cineplay-explore-page fade-in">
      {/* Header Banner */}
      <div className="explore-header-card">
        <span className="explore-badge font-display">CURATED SELECTION</span>
        <h1 className="explore-heading font-serif">Explore Videos & Shorts</h1>
        <p className="explore-desc">
          Discover trending videos, viral short clips, gaming highlights, music, and creative vlogs from creators worldwide.
        </p>

        {/* Genre Filter Pills */}
        <div className="explore-genre-strip">
          {GENRES.map((genre) => (
            <button
              key={genre}
              className={`explore-pill ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="spinner" />
      ) : videos.length > 0 ? (
        <div className="discovery-grid">
          {videos.map((vid) => (
            <VideoCard key={vid._id} video={vid} />
          ))}
        </div>
      ) : (
        <div className="empty-cinema-slate">
          <div className="empty-symbol font-serif">🎬</div>
          <h3 className="font-serif">No Titles Found</h3>
          <p>We couldn't find any videos under "{selectedGenre}". Explore our other cinema genres.</p>
        </div>
      )}
    </div>
  );
};

export default Explore;

