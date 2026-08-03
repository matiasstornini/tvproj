import { useEffect, useRef } from "react";
import { XIcon, FilmIcon, Maximize2Icon, AlertTriangleIcon } from "lucide-react";
import Artplayer from "artplayer";
import { remoteSync } from "@/lib/remote-sync";
import { formatUrl } from "@/lib/api";

function ArtPlayerComponent({
  url,
  subtitleUrl,
  title,
}: {
  url: string;
  subtitleUrl?: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const art = new Artplayer({
      container: containerRef.current,
      url: url,
      title: title,
      autoplay: true,
      autoSize: false,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      setting: true,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      theme: "#10b981",
      subtitle: subtitleUrl
        ? {
            url: subtitleUrl,
            type: "vtt",
            style: {
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: "bold",
              background: "rgba(0, 0, 0, 0.8)",
              borderRadius: "12px",
              padding: "6px 18px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.9)",
              textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
            },
          }
        : undefined,
      controls: [
        {
          position: "right",
          html: "📁 Cargar SRT",
          tooltip: "Cargar archivo .srt local",
          click: function () {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".srt,.vtt";
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const objectUrl = URL.createObjectURL(file);
                art.subtitle.url = objectUrl;
                art.notice.show = `Subtítulo cargado: ${file.name}`;
              }
            };
            input.click();
          },
        },
      ],
    });

    artRef.current = art;

    // Sincronización con el Control Remoto
    const unsubscribe = remoteSync.onKey((msg) => {
      if (!art) return;
      if (msg.type === "media-play") art.play();
      if (msg.type === "media-pause") art.pause();
      if (msg.type === "media-toggle") art.toggle();
      if (msg.type === "media-seek-back") art.seek = Math.max(0, art.currentTime - 10);
      if (msg.type === "media-seek-forward") art.seek = art.currentTime + 10;
      if (msg.type === "media-fullscreen" || msg.key === "f") {
        art.fullscreen = !art.fullscreen;
      }
    });

    return () => {
      unsubscribe();
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [url, subtitleUrl, title]);

  return <div ref={containerRef} className="h-full w-full bg-black overflow-hidden" />;
}

export function CinemaModal({
  title,
  subtitle,
  url,
  subtitleUrl,
  onClose,
}: {
  title: string;
  subtitle?: string;
  url: string;
  subtitleUrl?: string;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  useEffect(() => {
    const unsubscribe = remoteSync.onKey((msg) => {
      if (msg.key === "Escape" || msg.key === "Backspace" || msg.key === "Home") {
        onClose();
        return;
      }

      if (msg.type === "media-fullscreen" || msg.key === "f") {
        toggleFullscreen();
      }

      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(msg, "*");
      }
    });

    return unsubscribe;
  }, [onClose]);

  const formattedUrl = formatUrl(url);
  const formattedSubtitleUrl = subtitleUrl ? formatUrl(subtitleUrl) : undefined;
  const isPlaceholder = !formattedUrl || formattedUrl.startsWith("0.0.0") || formattedUrl.includes("0.0.0.9");
  const isDirectMedia = /\.(mp4|m3u8|webm|ogv|mov)(\?.*)?$/i.test(formattedUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 md:p-6 backdrop-blur-3xl animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <div
        className="tv-glass relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3.5 bg-white/5 shrink-0">
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
              onClick={toggleFullscreen}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              title="Alternar Pantalla Completa"
            >
              <Maximize2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              title="Cerrar (Esc / Inicio)"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Player Container */}
        <div className="relative min-h-0 flex-1 bg-black overflow-hidden flex items-center justify-center">
          {isPlaceholder ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 text-white/70">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangleIcon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Enlace no configurado en la planilla</h3>
              <p className="text-sm max-w-md text-white/60 leading-relaxed">
                El enlace registrado en la planilla es{" "}
                <span className="font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                  {url || "Vacío"}
                </span>.
              </p>
            </div>
          ) : isDirectMedia ? (
            <ArtPlayerComponent
              url={formattedUrl}
              subtitleUrl={formattedSubtitleUrl}
              title={title}
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
            <span>{isPlaceholder ? "Esperando URL válida" : "Reproductor Profesional ArtPlayer Activo"}</span>
          </div>
          <span>Presiona Atrás (Esc) o Inicio en tu celular para salir</span>
        </div>
      </div>
    </div>
  );
}
