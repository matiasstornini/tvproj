import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apps as defaultApps, shelf, sites, getTileStyle, type AppTile } from "./data";
import { AppleLogo, GlyphFor, PlayIcon, SearchIcon, SettingsIcon, UserIcon } from "./icons";
import { DetailOverlay } from "./DetailOverlay";
import { SeriesOverlay } from "./SeriesOverlay";
import { useAdminItems } from "@/hooks/useAdminItems";
import { remoteSync } from "@/lib/remote-sync";
import { QrCodeIcon, SmartphoneIcon, XIcon } from "lucide-react";

type Pos = { row: number; col: number };

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  if (!now) return { time: "", date: "" };
  const time = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("es-ES", { weekday: "long", month: "short", day: "numeric" });
  return { time, date: date.charAt(0).toUpperCase() + date.slice(1) };
}

export function TvHome() {
  const [pos, setPos] = useState<Pos>({ row: 0, col: 1 });
  const [open, setOpen] = useState<null | { title: string; subtitle: string; image?: string; url?: string }>(null);
  const [selectedSeries, setSelectedSeries] = useState<null | { key: string; title: string }>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [remoteUrl, setRemoteUrl] = useState<string>("");
  const { time, date } = useClock();
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { data: adminItems, isLoading, isError } = useAdminItems();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      setRemoteUrl(`http://${host}${port}/remote`);
    }
  }, []);

  // Synchronize remote key events sent from phone ONLY if the TV tab is currently active/visible
  useEffect(() => {
    const unsubscribe = remoteSync.onKey((msg) => {
      if (document.visibilityState === "visible") {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: msg.key, bubbles: true }));
      }
    });
    return unsubscribe;
  }, []);

  const openUrl = useCallback((url: string, tileName?: string) => {
    if (url.startsWith("sheet:series:")) {
      const seriesKey = url.replace("sheet:series:", "").trim();
      setSelectedSeries({ key: seriesKey, title: tileName || seriesKey });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Map API items directly into main mosaic tiles
  const mosaicTiles: AppTile[] = useMemo(() => {
    if (adminItems && adminItems.length > 0) {
      return adminItems.map((item) => {
        const style = getTileStyle(item.name);
        return {
          id: item.id,
          name: item.name,
          kind: style.kind,
          className: style.className,
          label: style.label,
          badge: style.badge,
          url: item.formattedUrl,
        };
      });
    }
    return defaultApps;
  }, [adminItems]);

  // Chunk tiles into rows of 6
  const appRows: AppTile[][] = useMemo(() => {
    const chunkSize = 6;
    const rows: AppTile[][] = [];
    for (let i = 0; i < mosaicTiles.length; i += chunkSize) {
      rows.push(mosaicTiles.slice(i, i + chunkSize));
    }
    return rows;
  }, [mosaicTiles]);

  // Row lengths for navigation: [Top Shelf, ...AppRows, Sites]
  const rowLengths = useMemo(() => {
    const lengths = [shelf.length];
    appRows.forEach((r) => lengths.push(r.length));
    lengths.push(sites.length);
    return lengths;
  }, [appRows]);

  const focusedItem = useMemo(() => {
    if (pos.row === 0) return shelf[pos.col]?.title;
    if (pos.row >= 1 && pos.row <= appRows.length) {
      return appRows[pos.row - 1]?.[pos.col]?.name;
    }
    if (pos.row === appRows.length + 1) return sites[pos.col]?.name;
    return "";
  }, [pos, appRows]);

  const activate = useCallback(() => {
    if (pos.row === 0) {
      const s = shelf[pos.col];
      setOpen({ title: s.title, subtitle: s.subtitle, image: s.image });
    } else if (pos.row >= 1 && pos.row <= appRows.length) {
      const tile = appRows[pos.row - 1]?.[pos.col];
      if (tile?.url) {
        openUrl(tile.url, tile.name);
      } else if (tile) {
        setOpen({ title: tile.name, subtitle: "Aplicación" });
      }
    } else {
      setOpen({ title: sites[pos.col].name, subtitle: "Página web favorita" });
    }
  }, [pos, appRows, openUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.visibilityState !== "visible") return;

      if (open || showQrModal || selectedSeries) {
        if (e.key === "Escape" || e.key === "Backspace") {
          setOpen(null);
          setShowQrModal(false);
          setSelectedSeries(null);
        }
        return;
      }
      const k = e.key;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(k)) return;
      e.preventDefault();
      if (k === "Enter" || k === " ") return activate();
      setPos((p) => {
        if (k === "ArrowLeft") return { ...p, col: Math.max(0, p.col - 1) };
        if (k === "ArrowRight") return { ...p, col: Math.min(rowLengths[p.row] - 1, p.col + 1) };
        const row = k === "ArrowUp" ? Math.max(0, p.row - 1) : Math.min(rowLengths.length - 1, p.row + 1);
        return { row, col: Math.min(p.col, rowLengths[row] - 1) };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activate, open, showQrModal, rowLengths]);

  useEffect(() => {
    const container = scrollRefs.current[pos.row];
    const el = container?.querySelector<HTMLElement>(`[data-col="${pos.col}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pos]);

  const focused = (row: number, col: number) => pos.row === row && pos.col === col;

  return (
    <div className="tv-surface relative min-h-screen w-full overflow-hidden pb-16">
      {/* status bar */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 pt-5 sm:grid-cols-3 sm:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <AppleLogo className="h-6 w-6 shrink-0 text-foreground/80" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground/90">{time}</p>
            <p className="truncate text-xs text-foreground/50">{date}</p>
          </div>
          <span className="tv-glass ml-1 hidden h-8 w-8 shrink-0 place-items-center rounded-full sm:grid">
            <UserIcon className="h-4 w-4 text-foreground/70" />
          </span>
        </div>
        <div className="hidden flex-col items-center justify-center sm:flex">
          <h1 className="text-sm font-semibold tracking-[0.22em] text-foreground/80">INICIO</h1>
          {adminItems && adminItems.length > 0 && (
            <span className="text-[10px] font-medium text-emerald-400">
              ● API Admin ({adminItems.length} Canales)
            </span>
          )}
          {isLoading && (
            <span className="text-[10px] text-foreground/40 animate-pulse">Cargando API...</span>
          )}
          {isError && (
            <span className="text-[10px] text-rose-400">Error en API</span>
          )}
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="tv-glass flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold text-foreground/80 hover:bg-foreground/10 transition-colors"
          >
            <SmartphoneIcon className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">Control Remoto</span>
          </button>
          <div className="tv-glass flex h-9 items-center gap-2 rounded-full px-4">
            <SearchIcon className="h-4 w-4 shrink-0 text-foreground/50" />
            <span className="text-sm text-foreground/50">Buscar</span>
          </div>
          <span className="tv-glass grid h-9 w-9 shrink-0 place-items-center rounded-full">
            <SettingsIcon className="h-4 w-4 text-foreground/70" />
          </span>
        </div>
      </header>

      {/* top shelf */}
      <section className="mt-6">
        <h2 className="px-6 text-lg font-semibold text-foreground/85 sm:px-10">Top Shelf</h2>
        <div
          ref={(el) => {
            scrollRefs.current[0] = el;
          }}
          className="hide-scrollbar mt-3 flex snap-x gap-5 overflow-x-auto px-6 py-6 sm:px-10"
        >
          {shelf.map((s, i) => (
            <button
              key={s.id}
              data-col={i}
              onMouseEnter={() => setPos({ row: 0, col: i })}
              onClick={() => setOpen({ title: s.title, subtitle: s.subtitle, image: s.image })}
              className={`focusable tile-base relative h-40 w-[19rem] shrink-0 snap-center text-left sm:h-48 sm:w-[26rem] ${
                focused(0, i) ? "is-focused" : ""
              }`}
            >
              <img
                src={s.image}
                alt={s.title}
                width={1280}
                height={720}
                loading={i < 2 ? undefined : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute right-4 top-4">
                <GlyphFor badge={s.badge} />
              </span>
              {focused(0, i) && (
                <span className="tv-glass absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-full">
                  <PlayIcon className="h-4 w-4 text-foreground" />
                </span>
              )}
              <span className="absolute bottom-4 left-4 right-4 flex flex-col items-start pl-14">
                <span className="truncate text-base font-semibold text-white">{s.title}</span>
                <span className="truncate text-xs text-white/70">{s.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* main mosaic grid (populated from API) */}
      <section className="mt-2">
        <div className="flex items-center justify-between px-6 sm:px-10">
          <h2 className="text-lg font-semibold text-foreground/85">Aplicaciones & Canales Principales</h2>
        </div>
        {appRows.map((rowTiles, rIndex) => {
          const rowNum = rIndex + 1;
          return (
            <div
              key={rIndex}
              ref={(el) => {
                scrollRefs.current[rowNum] = el;
              }}
              className="hide-scrollbar flex gap-5 overflow-x-auto px-6 py-4 sm:px-10"
            >
              {rowTiles.map((a, i) => (
                <button
                  key={a.id}
                  data-col={i}
                  onMouseEnter={() => setPos({ row: rowNum, col: i })}
                  onClick={() =>
                    a.url ? openUrl(a.url) : setOpen({ title: a.name, subtitle: "Aplicación" })
                  }
                  className={`focusable tile-base ${a.className} relative h-24 w-40 shrink-0 sm:h-28 sm:w-48 ${
                    focused(rowNum, i) ? "is-focused" : ""
                  }`}
                  aria-label={a.name}
                >
                  {a.kind === "wordmark" ? (
                    <span
                      className={`px-3 text-center font-bold tracking-tight uppercase ${
                        a.id.includes("netflix") ? "text-xl tracking-[0.08em]" : "text-lg"
                      }`}
                    >
                      {a.label || a.name}
                    </span>
                  ) : (
                    <GlyphFor badge={a.badge || a.id} className="h-10 w-auto" />
                  )}
                  {a.url && (
                    <span className="absolute bottom-1.5 right-2 text-[9px] font-semibold tracking-wider text-emerald-400/90 uppercase">
                      ↗ Pestaña
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </section>

      {/* favorite sites */}
      <section className="mt-4">
        <h2 className="px-6 text-lg font-semibold text-foreground/85 sm:px-10">Páginas Web Favoritas</h2>
        <div
          ref={(el) => {
            scrollRefs.current[appRows.length + 1] = el;
          }}
          className="hide-scrollbar mt-3 flex gap-4 overflow-x-auto px-6 py-5 sm:px-10"
        >
          {sites.map((s, i) => (
            <button
              key={s.id}
              data-col={i}
              onMouseEnter={() => setPos({ row: appRows.length + 1, col: i })}
              onClick={() => setOpen({ title: s.name, subtitle: "Página web favorita" })}
              className={`focusable tile-base ${s.className} h-20 w-24 shrink-0 text-xl font-bold sm:h-[5.5rem] sm:w-28 ${
                focused(appRows.length + 1, i) ? "is-focused" : ""
              }`}
              aria-label={s.name}
            >
              {s.short}
            </button>
          ))}
        </div>
      </section>

      <footer className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="tv-glass rounded-full px-4 py-2 text-xs text-foreground/60">
          Usa ← ↑ ↓ → para navegar · Enter para abrir · Esc para volver ·{" "}
          <span className="font-semibold text-foreground/80">{focusedItem}</span>
        </div>
      </footer>

      {open && <DetailOverlay item={open} onClose={() => setOpen(null)} />}

      {/* QR Code Modal for Mobile Control */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-xl"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="tv-glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/10"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <SmartphoneIcon className="h-10 w-10 text-emerald-400 mb-2" />
            <h3 className="text-xl font-bold tracking-tight text-foreground">Control Remoto Móvil</h3>
            <p className="mt-1 text-xs text-foreground/60 max-w-xs">
              Escanea este código QR con la cámara de tu celular para conectarte al control remoto en la misma red Wi-Fi:
            </p>

            {remoteUrl && (
              <div className="mt-5 p-3 bg-white rounded-2xl shadow-inner border border-white/20">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    remoteUrl
                  )}`}
                  alt="QR Code Control Remoto"
                  width={220}
                  height={220}
                  className="h-44 w-44 object-contain"
                />
              </div>
            )}

            <p className="mt-4 font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-1.5 select-all">
              {remoteUrl}
            </p>
          </div>
        </div>
      )}

      {selectedSeries && (
        <SeriesOverlay
          seriesKey={selectedSeries.key}
          seriesTitle={selectedSeries.title}
          onClose={() => setSelectedSeries(null)}
        />
      )}
    </div>
  );
}
