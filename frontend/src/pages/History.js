import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('cineplay_history') || '[]');
      setHistoryItems(items);
    } catch {
      setHistoryItems([]);
    }
  }, []);

  const handleConfirmClear = () => {
    localStorage.removeItem('cineplay_history');
    setHistoryItems([]);
    setShowClearModal(false);
    toast.success('Watch history cleared');
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 72 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold-primary)' }}>
            CHRONOLOGY
          </span>
          <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            Watch History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Videos and shorts you have watched on CinePlay
          </p>
        </div>

        {historyItems.length > 0 && (
          <button className="btn-charcoal" onClick={() => setShowClearModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Clear History</span>
          </button>
        )}
      </div>

      {historyItems.length > 0 ? (
        <div className="discovery-grid">
          {historyItems.map((vid) => (
            <VideoCard key={vid._id} video={vid} />
          ))}
        </div>
      ) : (
        <div className="empty-cinema-slate">
          <div className="empty-symbol font-serif">⏳</div>
          <h3 className="font-serif">No Watch History</h3>
          <p>Videos and shorts you watch on CinePlay will appear here.</p>
          <Link to="/" className="btn-gold" style={{ display: 'inline-block', marginTop: 12 }}>
            Explore Videos
          </Link>
        </div>
      )}

      {/* Custom Confirmation Popup Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Watch History?"
        message="This will remove all stored viewing history from this device. This action cannot be reversed."
        confirmText="Clear History"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmClear}
        onClose={() => setShowClearModal(false)}
      />
    </div>
  );
};

export default History;
