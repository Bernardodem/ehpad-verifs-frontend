import axios from 'axios';

const api = axios.create({ baseURL: '/verifs/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sso_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
