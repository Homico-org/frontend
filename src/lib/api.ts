import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

/**
 * Recursively transforms MongoDB _id to id in response data.
 * This ensures frontend always uses 'id' instead of '_id'.
 */
function transformIds(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(transformIds);
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      if (key === '_id') {
        // Transform _id to id, but only if id doesn't already exist
        if (!('id' in obj)) {
          result['id'] = obj[key];
        }
        // Skip _id in output
      } else if (key === '__v') {
        // Skip mongoose version key
      } else {
        result[key] = transformIds(obj[key]);
      }
    }

    return result;
  }

  return data;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Only access localStorage on client-side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Let axios handle Content-Type for FormData (multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Transform _id to id in all responses
    if (response.data) {
      response.data = transformIds(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      const originalRequest = error.config;

      // Don't retry refresh requests or requests already retried
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest._retry) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent("auth:logout"));
        window.dispatchEvent(new CustomEvent("auth:open-login-modal"));
        return Promise.reject(error);
      }

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
            .then(({ data }) => {
              localStorage.setItem('access_token', data.access_token);
              localStorage.setItem('refresh_token', data.refresh_token);
              api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
              originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
              processQueue(null, data.access_token);
              resolve(api(originalRequest));
            })
            .catch(err => {
              processQueue(err, null);
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.dispatchEvent(new CustomEvent("auth:logout"));
              window.dispatchEvent(new CustomEvent("auth:open-login-modal"));
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      // No refresh token — clear and show login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent("auth:logout"));
      window.dispatchEvent(new CustomEvent("auth:open-login-modal"));
    }
    return Promise.reject(error);
  }
);

export default api;
