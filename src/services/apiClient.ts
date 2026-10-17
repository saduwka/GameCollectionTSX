import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/rawg",
});

export default apiClient;
