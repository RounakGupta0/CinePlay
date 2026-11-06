import axios from 'axios';

const getBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim().replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://cineplay-55ik.onrender.com/api';
    }
  }
  return 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Attach token from localStorage to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sm_token');
      localStorage.removeItem('sm_user');
    }
    return Promise.reject(err);
  }
);

export default API;
