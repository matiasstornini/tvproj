import { useEffect, useRef } from "react";
import { XIcon, FilmIcon, Maximize2Icon, AlertTriangleIcon } from "lucide-react";
import { remoteSync } from "@/lib/remote-sync";
import { formatUrl } from "@/lib/api";

export function CinemaModal({
  title,
  subtitle,
  url,
  onClose,
}: {
  title: string;
  subtitle?: string;
  url: string;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const unsubscribe = remoteSync.onKey((msg) => {
      if (msg.key === "Escape" || msg.key === "Backspace") {
        onClose();
        return;
      }

      if (["media-play", "media-pause", "media-toggle", "media-seek-back", "media-seek-forward"].includes(msg.type)) {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(msg, "*");
        }
      }
    });

    return unsubscribe;
  }, [onClose]);

  const formattedUrl = formatUrl(url);
  const isPlaceholder = !formattedUrl || formattedUrl.startsWith("0.0.0") || formattedUrl.includes("0.0.0.9");
  const isDirectMedia = /\.(mp4|m3u8|webm|ogv|mov)(\?.*)?$/i.test(formattedUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 md:p-8 backdrop-blur-3xl animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <div
        className="tv-glass relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FilmIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white truncate">{title}</h2>
              {subtitle && <p className="text-xs font-medium text-white/50 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.();
                } else {
                  document.documentElement.requestFullscreen?.();
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              title="Pantalla Completa"
            >
              <Maximize2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              title="Cerrar (Esc)"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Player Container */}
        <div className="relative min-h-0 flex-1 bg-black overflow-hidden">
          {isPlaceholder ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 text-white/70">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangleIcon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Enlace no configurado en la planilla</h3>
              <p className="text-sm max-w-md text-white/60 leading-relaxed">
                El enlace registrado en la planilla de Google Sheets es{" "}
                <span className="font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg select-all">
                  {url || "Vacío"}
                </span>.
                <br />
                Por favor, reemplázalo en tu planilla con una URL real de reproductor web o enlace <span className="font-mono text-emerald-400">.mp4</span>.
              </p>
            </div>
          ) : isDirectMedia ? (
            <video
              src={formattedUrl}
              controls
              autoPlay
              className="h-full w-full object-contain"
            />
          ) : (
            <iframe
              ref={iframeRef}
              src={formattedUrl}
              allow="encrypted-media *; autoplay; fullscreen"
              allowFullScreen
              className="h-full w-full border-none"
            />
          )}
        </div>

        {/* Status Control Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-2.5 bg-white/5 text-xs text-white/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPlaceholder ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
            <span>{isPlaceholder ? "Esperando URL válida" : "Reproduciendo nativamente en Smart TV"}</span>
          </div>
          <span>Presiona Atrás (Esc) en tu celular para salir</span>
        </div>
      </div>
    </div>
  );
}
