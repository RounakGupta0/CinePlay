import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('sm_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await API.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('sm_user', JSON.stringify(data.user));
      }
    } catch {
      localStorage.removeItem('sm_token');
      localStorage.removeItem('sm_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('sm_token', data.token);
    localStorage.setItem('sm_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (usernameOrData, email, password, extra = {}) => {
    let payload;
    if (typeof usernameOrData === 'object' && usernameOrData !== null) {
      payload = usernameOrData;
    } else {
      payload = { username: usernameOrData, email, password, ...extra };
    }
    const { data } = await API.post('/auth/register', payload);
    return data;
  };

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch { }
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('sm_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

