import { useQuery } from "@tanstack/react-query";
import { fetchSeriesEpisodes, EpisodeItem } from "@/lib/api";

export function useSeriesEpisodes(seriesKey: string | null) {
  return useQuery<EpisodeItem[]>({
    queryKey: ["series-episodes", seriesKey],
    queryFn: () => (seriesKey ? fetchSeriesEpisodes(seriesKey) : Promise.resolve([])),
    enabled: !!seriesKey,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });
}
