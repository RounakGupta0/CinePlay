import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import CustomDropdown from '../components/CustomDropdown';
import { toast } from 'react-toastify';
import './Upload.css';

const CATEGORIES = [
  'Entertainment', 'Shorts', 'Gaming', 'Music', 'Technology', 'Education',
  'Comedy', 'Vlogs', 'Travel', 'Art', 'Sports', 'News'
];

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isShortParam = searchParams.get('type') === 'short' || searchParams.get('short') === 'true';
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(isShortParam ? 'Shorts' : 'Entertainment');
  const [tags, setTags] = useState('');
  const [isShort, setIsShort] = useState(isShortParam);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Handle URL short parameter
  useEffect(() => {
    if (isShortParam && !editId) {
      setIsShort(true);
      setCategory('Shorts');
    }
  }, [isShortParam, editId]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // User's own uploads & Platform catalog preview
  const [userVideos, setUserVideos] = useState([]);
  const [loadingUserVideos, setLoadingUserVideos] = useState(false);
  const [catalogVideos, setCatalogVideos] = useState([]);

  // If edit mode, load existing video data
  useEffect(() => {
    if (editId) {
      const loadVideo = async () => {
        try {
          const { data } = await API.get(`/videos/${editId}`);
          if (data.success) {
            setTitle(data.video.title);
            setDescription(data.video.description || '');
            setCategory(data.video.category || 'Entertainment');
            setTags(data.video.tags?.join(', ') || '');
            setIsShort(!!data.video.isShort || data.video.category === 'Shorts');
            if (data.video.thumbnail?.url) {
              setThumbnailPreview(data.video.thumbnail.url);
            }
          }
        } catch (err) {
          toast.error('Failed to load video for editing');
        }
      };
      loadVideo();
    }
  }, [editId]);

  // Fetch creator's uploaded videos and recent platform catalog
  const fetchVideosData = useCallback(async () => {
    try {
      if (user?._id) {
        setLoadingUserVideos(true);
        const { data } = await API.get(`/videos/user/${user._id}`);
        if (data.success) {
          setUserVideos(data.videos || []);
        }
      }
      // Also fetch recent platform uploads
      const catRes = await API.get('/videos?limit=8&sort=newest');
      if (catRes.data?.success) {
        setCatalogVideos(catRes.data.videos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUserVideos(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVideosData();
  }, [fetchVideosData]);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('Video file size exceeds 500MB limit');
        return;
      }

      // Check duration for shorts using HTML5 video metadata
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src);
        const durationSec = tempVideo.duration;
        if (isShort && durationSec > 125) {
          toast.warning(
            `Selected video is ${Math.round(durationSec)}s long. Short videos must be 2 minutes (120 seconds) or less.`
          );
        }
      };
      tempVideo.src = URL.createObjectURL(file);

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      if (!title) {
        const name = file.name.replace(/\.[^/.]+$/, '');
        setTitle(name);
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Thumbnail file size exceeds 10MB limit');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editId && !videoFile) {
      toast.error('Please select a video file to upload');
      return;
    }

    // Verify 2-minute limit for shorts
    if (isShort && videoFile) {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const duration = await new Promise((resolve) => {
        tempVideo.onloadedmetadata = () => resolve(tempVideo.duration);
        tempVideo.onerror = () => resolve(0);
        tempVideo.src = URL.createObjectURL(videoFile);
      });
      if (duration > 125) {
        toast.error(`Short video exceeds the 2-minute limit (${Math.round(duration)} seconds). Please trim your short or uncheck 'Publish as Short Video'.`);
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('isShort', isShort);

    if (videoFile) {
      formData.append('video', videoFile);
    }
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      setUploading(true);
      setProgress(0);

      let res;
      if (editId) {
        res = await API.put(`/videos/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          }
        });
      } else {
        res = await API.post('/videos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          }
        });
      }

      if (res.data.success) {
        toast.success(editId ? 'Video updated successfully!' : 'Video uploaded successfully!');
        const videoId = res.data.video?._id || editId;
        navigate(`/watch/${videoId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please check file sizes and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page-container fade-in">
      <div className="upload-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="upload-badge">{isShort ? 'SHORTS STUDIO · VERTICAL REEL' : 'CREATOR STUDIO · UPLOAD'}</span>
          <h1>{editId ? 'Edit Video Details' : isShort ? 'Upload Short Video' : 'Upload Video or Short'}</h1>
          <p>{isShort ? 'Share vertical clips up to 2 minutes in duration with the CinePlay Shorts community.' : 'Share your videos, shorts, and creative content with the CinePlay community.'}</p>
        </div>
        <Link to="/" className="btn-gold" style={{ fontSize: '0.86rem', padding: '10px 22px' }}>
          Explore Home ➔
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="upload-form-grid">
        {/* Left Column: Form Inputs */}
        <div className="upload-details-column">
          <div className="form-group-custom">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Speedrun World Record, Travel Vlog, AI in 10 Minutes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              className="custom-input"
            />
            <span className="field-hint">{title.length}/100</span>
          </div>

          <div className="form-group-custom">
            <label>Description</label>
            <textarea
              placeholder="Tell viewers what your video or short is about, add links and timestamps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              className="custom-textarea"
            />
            <span className="field-hint">{description.length}/2000</span>
          </div>

          <div className="form-row-2">
            <div className="form-group-custom">
              <label>Category</label>
              <CustomDropdown
                options={CATEGORIES}
                value={category}
                onChange={setCategory}
              />
            </div>

            <div className="form-group-custom">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. shorts, gaming, tutorial, vlog"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group-checkbox" style={{ marginTop: '14px', marginBottom: '10px' }}>
            <label className="checkbox-luxury-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={isShort}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsShort(checked);
                  if (checked && category !== 'Shorts') {
                    setCategory('Shorts');
                  }
                }}
                style={{ accentColor: '#D6AD62', width: 17, height: 17, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                Publish as Short Video (vertical 9:16 format / max 2 minutes)
              </span>
            </label>
          </div>

          {isShort && (
            <div style={{
              background: 'var(--gold-muted)',
              border: '1px solid var(--border-gold-subtle)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>📱</span>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--gold-primary)' }}>Shorts Format Active:</strong> Maximum duration is <strong>2 minutes (120s)</strong>. Your short will be featured directly in CinePlay's dedicated Shorts Feed.
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="upload-progress-box">
              <div className="progress-labels">
                <span>Uploading and processing video...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="form-submit-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-publish"
              disabled={uploading}
            >
              {uploading ? 'Processing Video...' : (editId ? 'Save Changes' : 'Upload Video')}
            </button>
          </div>
        </div>

        {/* Right Column: Video & Thumbnail Upload Cards */}
        <div className="upload-media-column">
          {/* Video Dropzone */}
          {!editId && (
            <div className="media-upload-card">
              <h3>Video File *</h3>
              <p className="card-subtext">Upload video clip or short in MP4, WebM, or MOV format.</p>
              <label className="file-drop-area">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi"
                  onChange={handleVideoChange}
                  style={{ display: 'none' }}
                />
                {videoPreview ? (
                  <div className="video-preview-wrapper">
                    <video src={videoPreview} controls className="preview-video" />
                    <span className="change-file-badge">Replace File</span>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <div className="upload-cloud-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="primary-prompt">Choose video file</p>
                    <p className="sub-prompt">MP4, WebM, MOV, or MKV up to 500MB</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Thumbnail Dropzone */}
          <div className="media-upload-card">
            <h3>Video Thumbnail (Optional)</h3>
            <p className="card-subtext">Upload a custom cover thumbnail. If omitted, one is generated automatically.</p>
            <label className="file-drop-area thumb-area">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
              {thumbnailPreview ? (
                <div className="thumb-preview-wrapper">
                  <img src={thumbnailPreview} alt="Preview" className="preview-img" />
                  <span className="change-file-badge">Replace Thumbnail</span>
                </div>
              ) : (
                <div className="drop-prompt">
                  <div className="upload-cloud-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <p className="primary-prompt">Upload thumbnail image</p>
                  <p className="sub-prompt">1280x720 recommended (16:9 ratio)</p>
                </div>
              )}
            </label>
          </div>
        </div>
      </form>

      {/* Creator Uploads & Platform Catalog Section */}
      {user && (
        <div className="user-uploads-section" style={{ marginTop: 56, paddingTop: 36, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                {userVideos.length > 0
                  ? `Your Uploaded Videos (${userVideos.length})`
                  : `Recent Platform Uploads (${catalogVideos.length})`}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {userVideos.length > 0
                  ? 'Videos and shorts published from your channel'
                  : 'Videos currently live across the CinePlay community catalog'}
              </p>
            </div>
            <Link to="/your-videos" className="section-more-link">
              <span>Open Creator Studio</span>
            </Link>
          </div>

          {loadingUserVideos ? (
            <div className="spinner" style={{ margin: '30px auto' }}></div>
          ) : userVideos.length > 0 ? (
            <div className="discovery-grid">
              {userVideos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>
          ) : catalogVideos.length > 0 ? (
            <div>
              <div className="empty-cinema-slate" style={{ padding: '24px 20px', marginBottom: 24 }}>
                <p style={{ margin: 0 }}>
                  You haven't uploaded any videos from your channel yet. Use the form above to publish your first video, or browse the active community catalog below:
                </p>
              </div>
              <div className="discovery-grid">
                {catalogVideos.map((vid) => (
                  <VideoCard key={vid._id} video={vid} />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-cinema-slate" style={{ padding: '40px 20px' }}>
              <p style={{ margin: 0 }}>
                No uploaded videos found yet. Use the form above to share your first video!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
