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

export const searchYouTubeVideos = async (query: string, maxResults = 5, lang: string = 'en'): Promise<YouTubeVideo[]> => {
  if (!API_KEY) {
    // ... mock data logic ...
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
        relevanceLanguage: lang,
        regionCode: lang === 'ru' ? 'RU' : 'US'
      }
    });

    return response.data.items.map((item: any) => ({
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

export const getGameMedia = async (gameName: string, lang: string = 'en') => {
  const [ost, reviews] = await Promise.all([
    searchYouTubeVideos(`${gameName} OST`, 3, lang),
    searchYouTubeVideos(lang === 'ru' ? `${gameName} обзор игры` : `${gameName} review`, 6, lang)
  ]);
  
  return { ost, reviews };
};
