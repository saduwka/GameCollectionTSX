// FILE: src/services/media/youtubeService.ts
import axios from "axios";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export const searchYouTubeVideos = async (query: string, maxResults = 5): Promise<YouTubeVideo[]> => {
  if (!API_KEY) {
    console.warn("YouTube API Key is missing. Using dummy data for development.");
    return [
      {
        id: "dQw4w9WgXcQ",
        title: `Mock: ${query} Video 1`,
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
        channelTitle: "Official Channel",
        publishedAt: new Date().toISOString()
      },
      {
        id: "vjNfS-Y6V7w",
        title: `Mock: ${query} Video 2`,
        thumbnail: "https://img.youtube.com/vi/vjNfS-Y6V7w/0.jpg",
        channelTitle: "Gamer Reviews",
        publishedAt: new Date().toISOString()
      }
    ];
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        part: "snippet",
        maxResults: maxResults,
        q: query,
        type: "video",
        key: API_KEY,
        relevanceLanguage: "en"
      }
    });

    return response.data.items.map((item: { id: { videoId: string }; snippet: { title: string; thumbnails: { high?: { url: string }; default?: { url: string } }; channelTitle: string; publishedAt: string } }) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
};

export const getGameMedia = async (gameName: string) => {
  const [ost, reviewsEn, reviewsRu] = await Promise.all([
    searchYouTubeVideos(`${gameName} OST`, 3),
    searchYouTubeVideos(`${gameName} review`, 3),
    searchYouTubeVideos(`${gameName} обзор игры`, 3)
  ]);

  // Merge and deduplicate reviews, or just combine them
  const allReviews = [...reviewsRu, ...reviewsEn];
  
  return { ost, reviews: allReviews };
};
