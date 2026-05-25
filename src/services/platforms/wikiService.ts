import axios from "axios";

export interface WikiData {
  title: string;
  extract: string;
  thumbnail?: string;
  content_urls?: {
    desktop: {
      page: string;
    };
  };
}

export const getWiki = async (query: string, lang: 'ru' | 'en' = 'ru'): Promise<WikiData | null> => {
  const title = query.replace(/\s+/g, "_");
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'GameCollectionTSX/1.0 (https://github.com/saduwka/GameCollectionTSX)'
      }
    });
    return response.data;
  } catch (error) {
    if (lang === 'ru') {
      return getWiki(query, 'en');
    }
    console.error(`Error fetching Wiki for ${query}:`, error);
    return null;
  }
};

export const getPlatformWiki = getWiki;
