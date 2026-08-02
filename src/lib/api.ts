export interface AdminItem {
  id: string;
  name: string;
  url: string;
  formattedUrl: string;
}

export interface EpisodeItem {
  id: string;
  series: string;
  season: string;
  episode: string;
  title: string;
  streamUrl: string;
  subtitleUrl?: string;
  referer?: string;
}

export function formatUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // Si es un número plano (como "9" o "4"), NUNCA tratarlo como URL
  if (/^\d+$/.test(trimmed)) {
    return "";
  }

  if (trimmed.startsWith("sheet:") || trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Si es un dominio como youtube.com o cuevana.la
  if (/^([a-z0-9-]+\.)+[a-z]{2,}/i.test(trimmed) && !trimmed.startsWith("0.0.0")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export async function fetchAdminItems(): Promise<AdminItem[]> {
  const endpoint =
    "https://docs.google.com/spreadsheets/d/1qhQT8c4b6ZdNsqgkjMiFpHMcVClSJdWNA-5r13gSpcU/gviz/tq?&tqx=out:json&sheet=Admin";

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Error al obtener los datos de la planilla: ${res.statusText}`);
  }

  const text = await res.text();
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Formato de respuesta GVIZ inválido");
  }

  const jsonStr = text.substring(startIdx, endIdx + 1);
  const data = JSON.parse(jsonStr);

  const rows = data?.table?.rows || [];
  const items: AdminItem[] = [];

  rows.forEach((row: { c?: Array<{ v?: string | number | null } | null> }, idx: number) => {
    const c = row?.c;
    if (!c || c.length < 2) return;

    const name = c[0]?.v ? String(c[0].v).trim() : "";
    const rawUrl = c[1]?.v ? String(c[1].v).trim() : "";

    if (!name || !rawUrl) return;

    items.push({
      id: `admin-${idx}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name: name,
      url: rawUrl,
      formattedUrl: formatUrl(rawUrl),
    });
  });

  return items;
}

export async function fetchSeriesEpisodes(seriesKey: string): Promise<EpisodeItem[]> {
  const endpoint =
    "https://docs.google.com/spreadsheets/d/1qhQT8c4b6ZdNsqgkjMiFpHMcVClSJdWNA-5r13gSpcU/gviz/tq?&tqx=out:json&sheet=Series";

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Error al obtener la lista de episodios: ${res.statusText}`);
  }

  const text = await res.text();
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1) {
    return [];
  }

  const jsonStr = text.substring(startIdx, endIdx + 1);
  const data = JSON.parse(jsonStr);

  const rows = data?.table?.rows || [];
  const episodes: EpisodeItem[] = [];
  const targetFilter = seriesKey.toLowerCase().trim();

  rows.forEach((row: { c?: Array<{ v?: string | number | null } | null> }, idx: number) => {
    const c = row?.c;
    if (!c || c.length < 2) return;

    const series = c[0]?.v ? String(c[0].v).trim() : "";
    const season = c[1]?.v ? String(c[1].v).trim() : "1";
    const episode = c[2]?.v ? String(c[2].v).trim() : String(idx + 1);

    const valLink = c[3]?.v ? String(c[3].v).trim() : "";
    const valSrt = c[4]?.v ? String(c[4].v).trim() : "";
    const valReferer = c[5]?.v ? String(c[5].v).trim() : undefined;

    const streamUrl = formatUrl(valLink);
    const subtitleUrl = valSrt ? formatUrl(valSrt) : undefined;
    const title = `Capítulo ${episode}`;

    if (series && (series.toLowerCase() === targetFilter || series.toLowerCase().includes(targetFilter) || targetFilter.includes(series.toLowerCase()))) {
      episodes.push({
        id: `ep-${idx}-${series.toLowerCase()}-${season}-${episode}`,
        series,
        season,
        episode,
        title,
        streamUrl,
        subtitleUrl,
        referer: valReferer,
      });
    }
  });

  return episodes;
}
