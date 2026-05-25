import axios from "axios";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = "https://api.rawg.io/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY,
  },
});

export default apiClient;
