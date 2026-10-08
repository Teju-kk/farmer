import axios from 'axios';
const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');
const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => { const token = localStorage.getItem('krishi_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && localStorage.getItem('krishi_token')) {
    localStorage.removeItem('krishi_token');
    window.dispatchEvent(new window.Event('krishi:unauthorized'));
  }
  return Promise.reject(error);
});
export default api;
