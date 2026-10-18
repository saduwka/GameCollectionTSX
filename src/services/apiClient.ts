import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_RAWG_PROXY_URL,
});

export default apiClient;
