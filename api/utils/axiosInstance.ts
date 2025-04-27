
import  * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { SERVER_PORT } from "../config"; // adjust path if needed

const axiosInstance = axios.create({
  baseURL: SERVER_PORT,
});

// Add a request interceptor to attach token automatically
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
