import apiClient from "../apiClient";
import type { TonightGame } from "./tonightScore";
import type { Mood, TonightTime } from "./tonightScore";

export const fetchTonight = async (options: {
  mood: Mood;
  time: TonightTime;
  platforms: number[];
  exclude: number[];
  seen: number[];
}) => {
  const params: Record<string, string> = {
    mood: options.mood,
    time: String(options.time),
  };
  if (options.platforms.length) params.platforms = options.platforms.slice(0, 5).join(",");
  if (options.exclude.length) params.exclude = options.exclude.slice(0, 200).join(",");
  if (options.seen.length) params.seen = options.seen.slice(0, 50).join(",");
  const { data } = await apiClient.get<{ results: TonightGame[]; pool: number }>("/tonight", { params });
  return data;
};
