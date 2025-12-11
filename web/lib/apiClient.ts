import axios from 'axios';
import { API_URL } from '@/lib/config';

// Singleton para armazenar a função de logout global
let forceLogoutAndNotify: ((msg: string) => void) | null = null;

export function setForceLogoutAndNotify(fn: (msg: string) => void) {
  forceLogoutAndNotify = fn;
}

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor de requisição: adiciona token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('token');
      if (token && config.url && !config.url.includes('/login') && !config.url.includes('/signup')) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: trata 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && forceLogoutAndNotify) {
      forceLogoutAndNotify('Sessão expirada. Faça login novamente.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
