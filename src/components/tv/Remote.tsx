import { useCallback, useEffect, useRef, useState } from "react";
import { remoteSync } from "@/lib/remote-sync";

type Dir = "up" | "down" | "left" | "right";

const KEY_FOR: Record<Dir, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

function useLandscape() {
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)");
    const on = () => setLandscape(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return landscape;
}

function buzz(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}

export function Remote() {
  const landscape = useLandscape();
  const [last, setLast] = useState("Listo");
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const pad = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const moved = useRef(false);

  const send = useCallback((label: string, key: string) => {
    setLast(label);
    buzz();
    remoteSync.sendKey(key, label);
  }, []);

  const handleMedia = (actionType: string, label: string) => {
    setLast(label);
    buzz();
    remoteSync.sendMediaAction(actionType);
  };

  const onStart = (e: React.PointerEvent) => {
    const r = pad.current?.getBoundingClientRect();
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    moved.current = false;
    if (r) setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() });
  };

  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 55) return;
    moved.current = true;
    const dir: Dir =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    send(dir === "up" ? "Arriba" : dir === "down" ? "Abajo" : dir === "left" ? "Izquierda" : "Derecha", KEY_FOR[dir]);
    start.current = { x: e.clientX, y: e.clientY, t: s.t };
  };

  const onEnd = () => {
    const s = start.current;
    start.current = null;
    setTimeout(() => setRipple(null), 320);
    if (s && !moved.current && Date.now() - s.t < 400) send("Seleccionar", "Enter");
  };

  const Pad = (
    <div
      ref={pad}
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      className="tv-glass relative w-full flex-1 touch-none select-none overflow-hidden rounded-[2rem] border border-foreground/10 shadow-[0_20px_45px_-25px_oklch(0.2_0.04_260/0.6)]"
    >
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="text-xs font-medium uppercase tracking-[0.28em] text-foreground/35">
          Trackpad
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-1/2 top-4 -translate-x-1/2 text-foreground/25">▲</span>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-foreground/25">▼</span>
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/25">◀</span>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/25">▶</span>
      </div>
      {ripple && (
        <span
          key={ripple.id}
          className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/10 blur-md"
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}
    </div>
  );

  const btn =
    "tv-glass grid place-items-center rounded-2xl border border-foreground/10 text-sm font-medium text-foreground/80 active:scale-95 transition-transform";

  const Controls = (
    <div className="grid grid-cols-3 gap-3">
      <button className={`${btn} h-14`} onClick={() => send("Atrás", "Escape")}>
        ‹ Atrás
      </button>
      <button className={`${btn} h-14`} onClick={() => send("Inicio", "Home")}>
        ⌂ Inicio
      </button>
      <button className={`${btn} h-14`} onClick={() => handleMedia("media-toggle", "Play/Pausa")}>
        ▷ ⏸
      </button>
      <button className={`${btn} h-14`} onClick={() => send("Volumen +", "AudioVolumeUp")}>
        Vol +
      </button>
      <button className={`${btn} h-14`} onClick={() => send("Silencio", "AudioVolumeMute")}>
        Silencio
      </button>
      <button className={`${btn} h-14`} onClick={() => send("Volumen −", "AudioVolumeDown")}>
        Vol −
      </button>
    </div>
  );

  const DPad = (
    <div className="relative mx-auto aspect-square w-full max-w-[16rem]">
      <div className="tv-glass absolute inset-0 rounded-full border border-foreground/10" />
      {(["up", "down", "left", "right"] as Dir[]).map((d) => (
        <button
          key={d}
          onClick={() => send(d, KEY_FOR[d])}
          aria-label={d}
          className={`absolute grid h-14 w-14 place-items-center rounded-full text-foreground/60 active:bg-foreground/10 ${
            d === "up"
              ? "left-1/2 top-2 -translate-x-1/2"
              : d === "down"
                ? "bottom-2 left-1/2 -translate-x-1/2"
                : d === "left"
                  ? "left-2 top-1/2 -translate-y-1/2"
                  : "right-2 top-1/2 -translate-y-1/2"
          }`}
        >
          {d === "up" ? "▲" : d === "down" ? "▼" : d === "left" ? "◀" : "▶"}
        </button>
      ))}
      <button
        onClick={() => send("Seleccionar", "Enter")}
        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/85 text-sm font-semibold text-background active:scale-95"
      >
        OK
      </button>
    </div>
  );

  return (
    <div className="tv-surface flex h-[100dvh] w-full flex-col overflow-hidden px-4 py-3 gap-2.5">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-[0.24em] text-foreground/70">CONTROL</h1>
        <span className="tv-glass rounded-full px-3 py-1 text-xs text-foreground/60">{last}</span>
      </header>

      {/* Permanent Dedicated Media Control Bar */}
      <div className="tv-glass flex items-center justify-between gap-1 rounded-2xl px-2.5 py-2 border border-emerald-500/30 bg-emerald-950/20 shadow-md">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 pl-1 shrink-0">
          Video
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleMedia("media-seek-back", "-10s")}
            className="tv-glass px-2 py-1.5 text-xs font-bold rounded-xl text-foreground active:scale-95"
          >
            ⏪ -10s
          </button>
          <button
            onClick={() => handleMedia("media-play", "▶ PLAY")}
            className="bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 text-xs font-bold rounded-xl text-black shadow-md active:scale-95"
          >
            ▶ PLAY
          </button>
          <button
            onClick={() => handleMedia("media-pause", "⏸ PAUSA")}
            className="bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-bold rounded-xl text-white shadow-md active:scale-95"
          >
            ⏸ PAUSA
          </button>
          <button
            onClick={() => handleMedia("media-seek-forward", "+10s")}
            className="tv-glass px-2 py-1.5 text-xs font-bold rounded-xl text-foreground active:scale-95"
          >
            +10s ⏩
          </button>
          <button
            onClick={() => {
              handleMedia("media-fullscreen", "📺 Pantalla Completa");
              send("Pantalla Completa", "f");
            }}
            className="bg-sky-600 hover:bg-sky-500 px-2 py-1.5 text-xs font-bold rounded-xl text-white shadow-md active:scale-95"
            title="Alternar Pantalla Completa"
          >
            📺 Full
          </button>
        </div>
      </div>

      {landscape ? (
        <div className="mt-1 grid min-h-0 flex-1 grid-cols-2 items-center gap-5">
          {DPad}
          <div className="flex flex-col gap-3">{Controls}</div>
        </div>
      ) : (
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-3">
          {Pad}
          {Controls}
        </div>
      )}

      <p className="text-center text-[11px] text-foreground/40">
        {landscape ? "Vuelve a vertical para el trackpad" : "Gira el teléfono para los botones físicos"}
      </p>
    </div>
  );
}
