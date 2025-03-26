import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// Add a request interceptor to dynamically set Content-Type
axiosInstance.interceptors.request.use((config) => {
  // Only set Content-Type if it's NOT explicitly specified in the request
  if (!config.headers['Content-Type']) {
    if (config.data instanceof FormData) {
      // Let Axios handle FormData automatically (it sets the correct Content-Type with boundary)
    } else {
      // Default to JSON for non-FormData payloads
      config.headers['Content-Type'] = 'application/json';
    }
  }
  return config;
});