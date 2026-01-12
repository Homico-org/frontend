import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // Clear old token key too

      // Dispatch custom event so AuthContext can react
      window.dispatchEvent(new CustomEven"auth:logout");

      // Dispatch event to open login modal (handled by AuthModalContext)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEven"auth:open-login-modal");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
