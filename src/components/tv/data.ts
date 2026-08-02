import shelf1 from "@/assets/shelf-1.jpg";
import shelf2 from "@/assets/shelf-2.jpg";
import shelf3 from "@/assets/shelf-3.jpg";
import shelf4 from "@/assets/shelf-4.jpg";

export type ShelfItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
};

export const shelf: ShelfItem[] = [
  { id: "s3", title: "Sombras", subtitle: "Serie · Temporada 2", badge: "apple", image: shelf3 },
  { id: "s1", title: "El Entrenador", subtitle: "Apple TV+", badge: "apple", image: shelf1 },
  { id: "s2", title: "Niebla Roja", subtitle: "Ver ahora", badge: "netflix", image: shelf2 },
  { id: "s4", title: "Ciudad Dorada", subtitle: "YouTube", badge: "youtube", image: shelf4 },
];

export type AppTile = {
  id: string;
  name: string;
  kind: "wordmark" | "icon";
  className: string;
  label?: string;
  badge?: string;
  url?: string;
};

export const apps: AppTile[] = [
  { id: "appletv", name: "Apple TV+", kind: "icon", className: "tile-appletv" },
  { id: "music", name: "Música", kind: "icon", className: "tile-music" },
  { id: "arcade", name: "Arcade", kind: "icon", className: "tile-arcade" },
  { id: "safari", name: "Safari", kind: "icon", className: "tile-safari" },
  { id: "netflix", name: "Netflix", kind: "wordmark", className: "tile-netflix", label: "NETFLIX" },
  { id: "youtube", name: "YouTube", kind: "icon", className: "tile-youtube" },
  { id: "disney", name: "Disney+", kind: "wordmark", className: "tile-disney", label: "Disney+" },
  { id: "prime", name: "Prime Video", kind: "wordmark", className: "tile-prime", label: "prime video" },
  { id: "hbo", name: "HBO Max", kind: "wordmark", className: "tile-hbo", label: "HBOMAX" },
  { id: "spotify", name: "Spotify", kind: "icon", className: "tile-spotify" },
  { id: "twitch", name: "Twitch", kind: "wordmark", className: "tile-twitch", label: "twitch" },
  { id: "appstore", name: "App Store", kind: "icon", className: "tile-appstore" },
];

export function getTileStyle(idOrName: string): {
  className: string;
  label: string;
  kind: "wordmark" | "icon";
  badge?: string;
} {
  const key = idOrName.toLowerCase();
  if (key.includes("youtube"))
    return { className: "tile-youtube", label: "YouTube", kind: "icon", badge: "youtube" };
  if (key.includes("tiktok"))
    return {
      className:
        "bg-gradient-to-br from-slate-950 via-neutral-900 to-pink-950 text-white border border-cyan-500/30",
      label: "TikTok",
      kind: "wordmark",
    };
  if (key.includes("flixmomo"))
    return {
      className:
        "bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white border border-purple-500/30",
      label: "FLIXMOMO",
      kind: "wordmark",
    };
  if (key.includes("lamovie"))
    return {
      className:
        "bg-gradient-to-br from-rose-950 via-neutral-900 to-slate-950 text-white border border-rose-500/30",
      label: "LAMOVIE",
      kind: "wordmark",
    };
  if (key.includes("suits"))
    return {
      className:
        "bg-gradient-to-br from-amber-950 via-neutral-900 to-slate-950 text-amber-200 border border-amber-500/30",
      label: "SUITS",
      kind: "wordmark",
    };
  if (key.includes("tnt"))
    return {
      className:
        "bg-gradient-to-br from-red-700 via-red-900 to-slate-950 text-white border border-red-500/40",
      label: "TNT SPORTS",
      kind: "wordmark",
    };
  if (key.includes("espn"))
    return { className: "site-espn", label: "ESPN", kind: "wordmark" };
  if (key.includes("netflix"))
    return { className: "tile-netflix", label: "NETFLIX", kind: "wordmark" };
  if (key.includes("disney"))
    return { className: "tile-disney", label: "Disney+", kind: "wordmark" };
  if (key.includes("prime"))
    return { className: "tile-prime", label: "prime video", kind: "wordmark" };
  if (key.includes("hbo"))
    return { className: "tile-hbo", label: "HBOMAX", kind: "wordmark" };
  if (key.includes("spotify"))
    return { className: "tile-spotify", label: "Spotify", kind: "icon", badge: "spotify" };
  if (key.includes("twitch"))
    return { className: "tile-twitch", label: "twitch", kind: "wordmark" };

  return {
    className:
      "bg-gradient-to-br from-neutral-900 via-neutral-950 to-slate-950 text-white border border-white/10",
    label: idOrName.toUpperCase(),
    kind: "wordmark",
  };
}

export type WebSite = { id: string; name: string; short: string; className: string };

export const sites: WebSite[] = [
  { id: "google", name: "Google", short: "G", className: "site-google" },
  { id: "wiki", name: "Wikipedia", short: "W", className: "site-wiki" },
  { id: "elpais", name: "El País", short: "EP", className: "site-elpais" },
  { id: "bbc", name: "BBC News", short: "BBC", className: "site-bbc" },
  { id: "web", name: "Web", short: "◍", className: "site-web" },
  { id: "quora", name: "Quora", short: "Q", className: "site-quora" },
  { id: "espn", name: "ESPN", short: "E", className: "site-espn" },
  { id: "reddit", name: "Reddit", short: "R", className: "site-reddit" },
  { id: "search", name: "Buscar", short: "Q", className: "site-search" },
];
