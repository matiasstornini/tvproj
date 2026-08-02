import { useEffect, useState } from "react";
import { PlayIcon, FilmIcon, XIcon, Loader2Icon, CaptionsIcon } from "lucide-react";
import { useSeriesEpisodes } from "@/hooks/useSeriesEpisodes";
import { EpisodeItem } from "@/lib/api";
import { CinemaModal } from "./CinemaModal";

export function SeriesOverlay({
  seriesKey,
  seriesTitle,
  onClose,
  onPlayEpisode,
}: {
  seriesKey: string;
  seriesTitle: string;
  onClose: () => void;
  onPlayEpisode?: (ep: EpisodeItem) => void;
}) {
  const { data: episodes, isLoading, isError } = useSeriesEpisodes(seriesKey);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeMedia, setActiveMedia] = useState<{ title: string; subtitle: string; url: string; subtitleUrl?: string } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (activeMedia) return;

      if (e.key === "Escape" || e.key === "Backspace") {
        onClose();
        return;
      }
      if (!episodes || episodes.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(episodes.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const activeEp = episodes[selectedIndex];
        if (activeEp) {
          handleSelect(activeEp);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [episodes, selectedIndex, activeMedia, onClose]);

  const handleSelect = (ep: EpisodeItem) => {
    if (onPlayEpisode) {
      onPlayEpisode(ep);
    } else if (ep.streamUrl) {
      setActiveMedia({
        title: `${seriesTitle} - T${ep.season}:E${ep.episode}`,
        subtitle: ep.title,
        url: ep.streamUrl,
        subtitleUrl: ep.subtitleUrl,
      });
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6 backdrop-blur-2xl animate-in fade-in duration-200"
        onClick={onClose}
        role="dialog"
        aria-label={seriesTitle}
      >
        <div
          className="tv-glass w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-7 py-5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FilmIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white capitalize">{seriesTitle}</h2>
                <p className="text-xs font-medium text-white/50">
                  Catálogo filtrado desde Google Sheets (Pestaña: Series)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-2.5">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/60">
                <Loader2Icon className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="text-sm font-medium">Buscando episodios en la planilla para "{seriesKey}"...</p>
              </div>
            )}

            {isError && (
              <div className="py-8 text-center text-red-400 text-sm">
                Error al consultar los episodios desde Google Sheets. Verifique la conexión.
              </div>
            )}

            {!isLoading && (!episodes || episodes.length === 0) && (
              <div className="py-12 text-center text-white/50 text-sm">
                No se encontraron episodios cargados para la serie <span className="font-semibold text-white">"{seriesKey}"</span> en la pestaña <span className="font-mono text-emerald-400">Series</span> de la planilla.
              </div>
            )}

            {episodes && episodes.length > 0 && (
              <div className="space-y-2">
                {episodes.map((ep, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => handleSelect(ep)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between rounded-2xl px-5 py-3.5 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.01]"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                            isSelected ? "bg-emerald-500 text-black" : "bg-white/10 text-white/70"
                          }`}
                        >
                          T{ep.season}:E{ep.episode}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white truncate">{ep.title}</h4>
                            {ep.subtitleUrl && (
                              <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                <CaptionsIcon className="h-3 w-3" /> SRT
                              </span>
                            )}
                          </div>
                          {ep.streamUrl && (
                            <p className="text-xs font-mono text-white/40 truncate max-w-md">
                              {ep.streamUrl}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 text-black shadow-md"
                            : "bg-white/10 text-white group-hover:bg-white/20"
                        }`}
                      >
                        <PlayIcon className="h-3.5 w-3.5 fill-current" /> Reproducir
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-7 py-4 bg-white/5 text-xs text-white/50">
            <span>Usa las flechas ▲ ▼ y OK de tu celular para elegir episodio</span>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-1.5 font-semibold text-white hover:bg-white/20"
            >
              Volver
            </button>
          </div>
        </div>
      </div>

      {activeMedia && (
        <CinemaModal
          title={activeMedia.title}
          subtitle={activeMedia.subtitle}
          url={activeMedia.url}
          subtitleUrl={activeMedia.subtitleUrl}
          onClose={() => setActiveMedia(null)}
        />
      )}
    </>
  );
}
