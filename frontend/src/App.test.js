import { render, screen } from '@testing-library/react';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import Shorts from './pages/Shorts';
import { BrowserRouter as Router, MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import API from './api/axios';

const routerFutureConfig = { v7_startTransition: true, v7_relativeSplatPath: true };

// Mock API calls cleanly
jest.mock('./api/axios');

beforeEach(() => {
  API.get.mockResolvedValue({
    data: {
      success: true,
      videos: [],
      pagination: { hasMore: false },
      user: null,
    },
  });
  API.post.mockResolvedValue({ data: { success: true } });
  API.put.mockResolvedValue({ data: { success: true } });
  API.delete.mockResolvedValue({ data: { success: true } });
});

describe('CinePlay Frontend Test Suite', () => {
  test('renders CinePlay logo branding', async () => {
    render(<App />);
    const logoElements = await screen.findAllByText(/CinePlay/i);
    expect(logoElements.length).toBeGreaterThanOrEqual(1);
    expect(logoElements[0]).toBeInTheDocument();
  });

  test('renders public Sign In button for unauthenticated users', async () => {
    render(<App />);
    const signInButton = await screen.findByRole('link', { name: /Sign In/i });
    expect(signInButton).toBeInTheDocument();
  });

  test('renders search input with placeholder', async () => {
    render(<App />);
    const searchInput = await screen.findByPlaceholderText(/Search videos/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('renders category filters', async () => {
    render(<App />);
    const allCategory = await screen.findByRole('button', { name: /^All$/i });
    expect(allCategory).toBeInTheDocument();
  });

  test('renders Shorts navigation item in sidebar', async () => {
    render(<App />);
    const shortsNav = await screen.findByRole('link', { name: /^Shorts$/i });
    expect(shortsNav).toBeInTheDocument();
  });

  test('renders theme toggle button in navbar', async () => {
    render(<App />);
    const themeToggleBtn = await screen.findByRole('button', { name: /Switch to (light|dark) theme/i });
    expect(themeToggleBtn).toBeInTheDocument();
  });

  test('renders dedicated + Short upload link when authenticated', async () => {
    localStorage.setItem('sm_token', 'mock-token');
    localStorage.setItem(
      'sm_user',
      JSON.stringify({ _id: 'u1', username: 'cinemaker', email: 'creator@cineplay.com' })
    );

    API.get.mockResolvedValue({
      data: {
        success: true,
        user: { _id: 'u1', username: 'cinemaker', email: 'creator@cineplay.com' },
        videos: [],
        pagination: { hasMore: false },
      },
    });

    try {
      render(<App />);
      const shortUploadBtn = await screen.findByRole('link', { name: /\+ Short/i });
      expect(shortUploadBtn).toBeInTheDocument();
    } finally {
      localStorage.clear();
    }
  });

  test('renders split-screen Login page with cinematic showcase and form', () => {
    render(
      <AuthProvider>
        <Router future={routerFutureConfig}>
          <Login />
        </Router>
      </AuthProvider>
    );

    // Left section visual showcase assertions
    expect(screen.getByText(/Every Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Deserves to Be Seen/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover extraordinary stories/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience cinema differently/i)).toBeInTheDocument();

    // Right section form assertions
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue your cinematic journey\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Email Address$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember Me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot Password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/OR CONTINUE WITH/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('renders split-screen Sign Up page with cinematic showcase and form', () => {
    render(
      <AuthProvider>
        <Router future={routerFutureConfig}>
          <Register />
        </Router>
      </AuthProvider>
    );

    // Left section visual showcase assertions
    expect(screen.getByText(/Your Next Chapter/i)).toBeInTheDocument();
    expect(screen.getByText(/Starts Here/i)).toBeInTheDocument();
    expect(screen.getByText(/Join a community where creators/i)).toBeInTheDocument();
    expect(screen.getByText(/and viewers share their passion for stories/i)).toBeInTheDocument();

    // Right section registration form assertions
    expect(screen.getByText(/Create Your Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Become part of the CinePlay community\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Full Name$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Email Address$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Phone Number \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Confirm Password$/i)).toBeInTheDocument();
    expect(screen.getByText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/OR SIGN UP WITH/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('renders Normal Video Watching Screen (Interface 1) with custom luxury controls', async () => {
    API.get.mockImplementation((url) => {
      if (url.includes('/videos/v1')) {
        return Promise.resolve({
          data: {
            success: true,
            video: {
              _id: 'v1',
              title: 'The Final Chapter - Official Trailer',
              description: 'A story that stays forever. Experience the journey of courage.',
              category: 'Film & Animation',
              tags: ['cinema', 'trailer'],
              views: 3900000,
              likesCount: 298000,
              dislikesCount: 120,
              uploader: {
                _id: 'u_cineplay',
                username: 'cineplay_official',
                channelName: 'CinePlay',
                subscribersCount: 12400000,
              },
              videoFile: { url: 'https://example.com/video.mp4', duration: 1117 },
              thumbnail: { url: 'https://example.com/thumb.jpg' },
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      if (url.includes('/likes/v1')) {
        return Promise.resolve({
          data: { success: true, liked: false, disliked: false, likesCount: 298000, dislikesCount: 120 },
        });
      }
      if (url.includes('/comments/v1')) {
        return Promise.resolve({
          data: { success: true, comments: [] },
        });
      }
      if (url.includes('/subscriptions/check')) {
        return Promise.resolve({ data: { success: true, subscribed: false } });
      }
      if (url.includes('/subscriptions/count')) {
        return Promise.resolve({ data: { success: true, count: 12400000 } });
      }
      return Promise.resolve({
        data: { success: true, videos: [] },
      });
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/watch/v1']} future={routerFutureConfig}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Check title and details
    expect(await screen.findByText(/The Final Chapter - Official Trailer/i)).toBeInTheDocument();
    expect(screen.getByText(/3.9M views/i)).toBeInTheDocument();

    // Check actions: Like/Dislike, Share, Save
    expect(screen.getByTitle(/^Like this video$/i)).toBeInTheDocument();
    expect(screen.getByTitle(/^Dislike this video$/i)).toBeInTheDocument();
    expect(screen.getByTitle(/^Share Link$/i)).toBeInTheDocument();
    expect(screen.getByTitle(/^Save to Watch Later$/i)).toBeInTheDocument();

    // Check creator profile & subscribe
    expect(screen.getByText(/^CinePlay$/i)).toBeInTheDocument();
    expect(screen.getByText(/12.4M subscribers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Subscribe$/i })).toBeInTheDocument();

    // Check custom player controls
    expect(screen.getByTitle(/Subtitles \/ Closed Captions/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Theater mode/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Fullscreen/i)).toBeInTheDocument();

    // Check Recommended filter chips
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^From CinePlay$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Recently Uploaded$/i })).toBeInTheDocument();
  });

  test('renders CinePlay Shorts Screen (Interface 2) with vertical reel and action panel', async () => {
    API.get.mockImplementation((url) => {
      if (url.includes('/videos/shorts')) {
        return Promise.resolve({
          data: {
            success: true,
            shorts: [
              {
                _id: 's1',
                title: 'The Beauty of Nature 🌿',
                description: 'Exploring the misty mountain ranges at sunrise.',
                category: 'Shorts',
                tags: ['nature', 'travel', 'explore', 'cinematic'],
                views: 2400000,
                likesCount: 248000,
                dislikesCount: 45,
                commentsCount: 12000,
                uploader: {
                  _id: 'u_nature',
                  username: 'nature_explorer',
                  channelName: 'Nature Explorer',
                  subscribersCount: 2600000,
                },
                videoFile: { url: 'https://example.com/short.mp4', duration: 15 },
                thumbnail: { url: 'https://example.com/thumb.jpg' },
                createdAt: new Date().toISOString(),
              },
            ],
          },
        });
      }
      if (url.includes('/likes/')) {
        return Promise.resolve({
          data: {
            success: true,
            liked: false,
            disliked: false,
            likesCount: 248000,
            dislikesCount: 45,
          },
        });
      }
      if (url.includes('/comments/')) {
        return Promise.resolve({
          data: {
            success: true,
            comments: [],
          },
        });
      }
      return Promise.resolve({
        data: { success: true },
      });
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/shorts/s1']} future={routerFutureConfig}>
          <Routes>
            <Route path="/shorts/:id" element={<Shorts />} />
            <Route path="/shorts" element={<Shorts />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Header assertion
    expect(await screen.findByText(/^Shorts$/i)).toBeInTheDocument();

    // Below Reel Information
    const titles = screen.getAllByText(/The Beauty of Nature 🌿/i);
    expect(titles.length).toBeGreaterThanOrEqual(1);

    const creators = screen.getAllByText(/Nature Explorer/i);
    expect(creators.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/2.6M subscribers/i)).toBeInTheDocument();
    expect(screen.getByText(/Original Sound - Nature Explorer/i)).toBeInTheDocument();

    // Right-side Action Panel
    expect(screen.getByRole('button', { name: /^Like$/i })).toBeInTheDocument();
    expect(screen.getByText(/248K/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Dislike$/i })).toBeInTheDocument();
    expect(screen.getByText(/Dislike/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Comments$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Share$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();

    // Right Column Recommended Shorts Header
    expect(screen.getByText(/More Shorts/i)).toBeInTheDocument();
  });
});
