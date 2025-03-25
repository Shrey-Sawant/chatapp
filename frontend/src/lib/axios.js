import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL:import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json", // Explicitly set JSON
      },
});
