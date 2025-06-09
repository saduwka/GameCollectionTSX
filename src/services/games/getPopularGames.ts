export async function getPopularGames(): Promise<Game[]> {
      const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
      const res = await fetch(`https://api.rawg.io/api/games?ordering=-rating&page_size=10&key=${API_KEY}`);
    
      if (!res.ok) {
        throw new Error(`Error fetching popular games: ${res.statusText}`);
      }
    
      const data = await res.json();
    
      return data.results.map((game: any) => ({
        id: game.id,
        name: game.name,
        description: game.description_raw || "",
        background_img: game.background_image || "",
        rating: game.rating ?? 0,
        platforms: (game.platforms || []).map((p: any) => p.platform),
        released: game.released || "Unknown",
        genres: (game.genres || []).map((g: any) => g),
      }));
    }