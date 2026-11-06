import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [channelName, setChannelName] = useState(user?.channelName || '');
  const [channelDescription, setChannelDescription] = useState(user?.channelDescription || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(user?.channelBanner?.url || '');

  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file size cannot exceed 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Banner file size cannot exceed 10MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('channelName', channelName);
      formData.append('channelDescription', channelDescription);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const { data } = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        updateUser(data.user);
        toast.success('Channel customization saved!');
        navigate(`/channel/${user._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update channel profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page-container fade-in">
      <div className="settings-header">
        <span className="settings-badge">STUDIO CONFIGURATION</span>
        <h1>Channel & Director Identity</h1>
        <p>Personalize your presence on CinePlay with custom cinema artwork and branding.</p>
      </div>

      <form onSubmit={handleSubmit} className="settings-card">
        {/* Banner upload */}
        <div className="settings-section">
          <h3>Theatrical Channel Banner</h3>
          <p className="section-hint">This marquee image appears across the header of your channel page. 2560 x 424 pixels recommended.</p>
          <div
            className="settings-banner-preview"
            style={{
              backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
              backgroundColor: '#0B0B0B'
            }}
          >
            <label className="btn-upload-overlay">
              <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{bannerPreview ? 'Change Marquee Banner' : 'Upload Marquee Banner'}</span>
            </label>
          </div>
        </div>

        {/* Avatar upload */}
        <div className="settings-section">
          <h3>Director / Studio Portrait</h3>
          <p className="section-hint">Your insignia appears across your channel, title cards, and discussion notes.</p>
          <div className="settings-avatar-group">
            <img
              src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.username}&background=D6AD62&color=000&size=100`}
              alt="Avatar"
              className="settings-avatar-img"
            />
            <label className="btn-upload-file">
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              Upload Portrait
            </label>
          </div>
        </div>

        {/* Text details */}
        <div className="settings-section">
          <h3>Cinematic Identity</h3>
          <div className="settings-input-group">
            <label>Studio / Channel Name</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Your studio or directorial display name"
              required
              className="custom-input"
            />
          </div>

          <div className="settings-input-group" style={{ marginTop: 16 }}>
            <label>Director Statement & Bio</label>
            <textarea
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="State your artistic vision, cinematography focus, and release schedule..."
              rows={4}
              maxLength={500}
              className="custom-textarea"
            />
            <span className="field-hint">{channelDescription.length}/500</span>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-publish" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
