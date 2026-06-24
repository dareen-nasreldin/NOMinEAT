import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

// Safely read a JSON value from localStorage. A corrupted or "undefined"
// string would otherwise throw during render and white-screen the whole app.
const readStoredUser = () => {
  const stored = localStorage.getItem('nom_user');
  if (!stored || stored === 'undefined') return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('nom_user');
    localStorage.removeItem('nom_token');
    return null;
  }
};

// Persist a user only when it is a real object. Storing `undefined` would
// coerce to the string "undefined" and poison every future page load.
const persistSession = (token, user) => {
  if (token && user) {
    localStorage.setItem('nom_token', token);
    localStorage.setItem('nom_user', JSON.stringify(user));
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nom_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('nom_token');
        localStorage.removeItem('nom_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    persistSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    persistSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (accessToken) => {
    const res = await api.post('/auth/google', { access_token: accessToken });
    localStorage.setItem('nom_token', res.data.token);
    localStorage.setItem('nom_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('nom_token');
    localStorage.removeItem('nom_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
