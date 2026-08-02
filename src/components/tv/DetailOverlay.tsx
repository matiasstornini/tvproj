import { PlayIcon, ExternalLinkIcon } from "lucide-react";

export function DetailOverlay({
  item,
  onClose,
}: {
  item: { title: string; subtitle: string; image?: string; url?: string };
  onClose: () => void;
}) {
  const handleOpen = () => {
    if (item.url) {
      const formattedUrl = /^https?:\/\//i.test(item.url) ? item.url : `https://${item.url}`;
      window.open(formattedUrl, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-label={item.title}
    >
      <div
        className="tv-glass w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            width={1280}
            height={720}
            className="h-56 w-full object-cover"
          />
        )}
        <div className="p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">{item.subtitle}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{item.title}</h3>
          {item.url && (
            <p className="mt-1 font-mono text-xs text-foreground/50 truncate">
              {item.url}
            </p>
          )}
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/60">
            {item.url
              ? "Al hacer clic, el enlace se abrirá directamente en una nueva pestaña del navegador."
              : "Contenido de demostración. En una Apple TV real aquí se abriría la aplicación con su propio catálogo, reproducción y controles."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleOpen}
              className="focusable inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            >
              {item.url ? (
                <>
                  <ExternalLinkIcon className="h-4 w-4" /> Abrir Enlace
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" /> Reproducir
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="tv-glass focusable rounded-full px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

