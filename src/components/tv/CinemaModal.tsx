import { useEffect, useRef, useState } from "react";
import { XIcon, FilmIcon, Maximize2Icon, AlertTriangleIcon, CaptionsIcon, UploadIcon, PlusIcon, MinusIcon } from "lucide-react";
import { remoteSync } from "@/lib/remote-sync";
import { formatUrl } from "@/lib/api";

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  if (!ts) return 0;
  const clean = ts.replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

function parseSrt(srtContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = srtContent.trim().replace(/\r\n/g, "\n").split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    const timeLineIndex = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const textLines = lines.slice(timeLineIndex + 1);

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    const text = textLines.join("\n").replace(/<[^>]*>/g, "").trim();

    if (!isNaN(start) && !isNaN(end) && text) {
      cues.push({ start, end, text });
    }
  }

  return cues;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [subtitleName, setSubtitleName] = useState<string>("");

  const formattedUrl = formatUrl(url);
  const formattedSubtitleUrl = subtitleUrl ? formatUrl(subtitleUrl) : undefined;
  const isPlaceholder = !formattedUrl || formattedUrl.startsWith("0.0.0") || formattedUrl.includes("0.0.0.9");
  const isDirectMedia = /\.(mp4|m3u8|webm|ogv|mov)(\?.*)?$/i.test(formattedUrl);

  // Cargar subtítulos precargados desde Google Sheet
  useEffect(() => {
    if (!formattedSubtitleUrl) return;
    setSubtitleName("Pre-cargado de Sheet");
    fetch(formattedSubtitleUrl)
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseSrt(text);
        setCues(parsed);
      })
      .catch((err) => console.error("Error cargando subtítulos:", err));
  }, [formattedSubtitleUrl]);

  useEffect(() => {
    const unsubscribe = remoteSync.onKey((msg) => {
      if (msg.key === "Escape" || msg.key === "Backspace") {
        onClose();
        return;
      }

      if (videoRef.current) {
        if (msg.type === "media-play") videoRef.current.play();
        if (msg.type === "media-pause") videoRef.current.pause();
        if (msg.type === "media-toggle") videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        if (msg.type === "media-seek-back") videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        if (msg.type === "media-seek-forward") videoRef.current.currentTime = videoRef.current.currentTime + 10;
      }

      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(msg, "*");
      }
    });

    return unsubscribe;
  }, [onClose]);

  // Actualizar subtítulo en pantalla en cada timeupdate
  const handleTimeUpdate = () => {
    if (!videoRef.current || cues.length === 0) return;
    const now = videoRef.current.currentTime + offset;
    const active = cues.find((c) => now >= c.start && now <= c.end);
    setCurrentSubtitle(active ? active.text : "");
  };

  // Cargar archivo .srt local manualmente desde el Pendrive/Mac
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubtitleName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseSrt(text);
        setCues(parsed);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 md:p-6 backdrop-blur-3xl animate-in fade-in duration-200"
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
            {/* Botón para Cargar .srt Manualmente */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt,.vtt"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tv-glass inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white active:scale-95"
              title="Cargar archivo .srt desde tu equipo"
            >
              <UploadIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>{subtitleName ? "Cambiar SRT" : "Cargar SRT"}</span>
            </button>

            {/* Control de Sincronización de Subtítulos (-0.5s / +0.5s) */}
            {cues.length > 0 && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-xs">
                <span className="text-white/40 text-[10px] font-mono mr-1">DESFASE:</span>
                <button
                  onClick={() => setOffset((o) => o - 0.5)}
                  className="p-0.5 rounded hover:bg-white/10 text-white/70"
                  title="Restar 0.5s"
                >
                  <MinusIcon className="h-3 w-3" />
                </button>
                <span className="font-mono text-emerald-400 text-xs px-1">
                  {offset > 0 ? `+${offset}s` : `${offset}s`}
                </span>
                <button
                  onClick={() => setOffset((o) => o + 0.5)}
                  className="p-0.5 rounded hover:bg-white/10 text-white/70"
                  title="Sumar 0.5s"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.();
                } else {
                  document.documentElement.requestFullscreen?.();
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            >
              <Maximize2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
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
            <div className="relative h-full w-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={formattedUrl}
                controls
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                className="h-full w-full object-contain"
              />

              {/* Renderizador de Subtítulos de Cine de Alto Contraste */}
              {currentSubtitle && (
                <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 z-30 max-w-4xl text-center px-4 animate-in fade-in duration-75">
                  <span className="inline-block bg-black/85 text-amber-300 border border-white/15 text-xl md:text-3xl font-bold px-5 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] tracking-wide leading-relaxed whitespace-pre-line select-none">
                    {currentSubtitle}
                  </span>
                </div>
              )}
            </div>
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
            {cues.length > 0 && (
              <span className="ml-2 flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <CaptionsIcon className="h-3 w-3" /> Subtítulos Activos ({cues.length} líneas)
              </span>
            )}
          </div>
          <span>Presiona Atrás (Esc) en tu celular para salir</span>
        </div>
      </div>
    </div>
  );
}
