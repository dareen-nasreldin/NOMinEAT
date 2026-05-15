import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:3001/api'),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nom_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Don't redirect on 401 from auth endpoints — those are login/register failures
    // that should display an error message, not bounce the user.
    const isAuthCall = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('nom_token');
      localStorage.removeItem('nom_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
