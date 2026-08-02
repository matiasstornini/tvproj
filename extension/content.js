// Apple TV Remote Helper v4.1 - Soporte JWPlayer & Reproductores Embed en Cuevana
(function () {
  // Ignorar si estamos en la aplicación Smart TV local
  if (
    window.location.port === "8080" ||
    window.location.pathname.startsWith("/remote") ||
    document.querySelector(".tv-surface")
  ) {
    return;
  }

  console.log("[Apple TV Remote v4.1] Script inyectado en marco/pestaña:", window.location.href);

  // 1. Inyectar estilos para el Cursor Virtual y el resalte imantado
  if (window.self === window.top) {
    const style = document.createElement("style");
    style.textContent = `
      #tv-virtual-cursor {
        position: fixed;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: radial-gradient(circle, #10b981 0%, #059669 70%, transparent 100%);
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 20px #10b981, 0 0 40px rgba(16, 185, 129, 0.8);
        pointer-events: none;
        z-index: 2147483647;
        transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), left 160ms cubic-bezier(0.2, 0.8, 0.2, 1), top 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
        transform: translate(-50%, -50%);
      }
      #tv-virtual-cursor::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.6);
        animation: tv-pulse 1.5s infinite;
      }
      @keyframes tv-pulse {
        0% { transform: scale(1); opacity: 0.9; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      .tv-magnet-target {
        outline: 3.5px solid #10b981 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 25px rgba(16, 185, 129, 0.85) !important;
        transition: outline 120ms ease, box-shadow 120ms ease !important;
      }
    `;
    document.head?.appendChild(style);
  }

  let cursorEl = null;
  if (window.self === window.top) {
    cursorEl = document.getElementById("tv-virtual-cursor");
    if (!cursorEl) {
      cursorEl = document.createElement("div");
      cursorEl.id = "tv-virtual-cursor";
      document.body.appendChild(cursorEl);
    }
  }

  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let currentTargetEl = null;

  function wakeUpMouseControls(x, y) {
    const target = document.elementFromPoint(x, y);
    if (target) {
      const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
      target.dispatchEvent(new MouseEvent("mousemove", opts));
      target.dispatchEvent(new MouseEvent("mouseover", opts));
    }
  }

  function updateCursorPos(x, y) {
    cursorX = Math.max(15, Math.min(window.innerWidth - 15, x));
    cursorY = Math.max(15, Math.min(window.innerHeight - 15, y));
    if (cursorEl) {
      cursorEl.style.left = `${cursorX}px`;
      cursorEl.style.top = `${cursorY}px`;
    }
    wakeUpMouseControls(cursorX, cursorY);
  }

  if (window.self === window.top) {
    updateCursorPos(cursorX, cursorY);
  }

  // 2. Control Inteligente de Reproductores (JWPlayer API, HTML5 video, JW-Reset divs, iframes)
  function controlAllVideos(actionType) {
    let handled = false;

    // A. Verificar JWPlayer API global
    if (typeof window.jwplayer === "function") {
      try {
        const player = window.jwplayer();
        if (player && typeof player.play === "function") {
          if (actionType === "media-play") player.play(true);
          else if (actionType === "media-pause") player.play(false);
          else if (actionType === "media-toggle") player.play();
          else if (actionType === "media-seek-back" && typeof player.seek === "function") player.seek(Math.max(0, player.getPosition() - 10));
          else if (actionType === "media-seek-forward" && typeof player.seek === "function") player.seek(player.getPosition() + 10);
          handled = true;
        }
      } catch (e) {}
    }

    // B. Controlar tags <video> directos en la ventana o iframe
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length > 0) {
      videos.forEach((v) => {
        try {
          if (actionType === "media-play") v.play();
          else if (actionType === "media-pause") v.pause();
          else if (actionType === "media-toggle") (v.paused ? v.play() : v.pause());
          else if (actionType === "media-seek-back") v.currentTime = Math.max(0, v.currentTime - 10);
          else if (actionType === "media-seek-forward") v.currentTime = v.currentTime + 10;
        } catch (e) {}
      });
      handled = true;
    }

    // C. Si es un div contenedor de JWPlayer (ej. .jw-media, .jw-reset, .jw-display-icon)
    const jwTarget = document.querySelector(".jw-media, .jw-reset, .jw-display-icon, .jw-overlay, #jwplayer, .jwplayer");
    if (jwTarget) {
      const opts = { bubbles: true, cancelable: true, clientX: 100, clientY: 100, view: window };
      jwTarget.dispatchEvent(new PointerEvent("pointerdown", opts));
      jwTarget.dispatchEvent(new MouseEvent("mousedown", opts));
      jwTarget.dispatchEvent(new PointerEvent("pointerup", opts));
      jwTarget.dispatchEvent(new MouseEvent("mouseup", opts));
      jwTarget.dispatchEvent(new MouseEvent("click", opts));
      if (typeof jwTarget.click === "function") jwTarget.click();
      handled = true;
    }

    return handled;
  }

  // 3. Obtener elementos imantables (incluyendo JWPlayer y reproductores Cuevana)
  function getMagnetElements() {
    const selector =
      'a[href], button, input, select, textarea, video, iframe, [role="button"], [role="link"], .ytd-thumbnail, ytd-rich-grid-media, .card, .item, .jw-media, .jw-reset, .jwplayer, .jw-display-icon, #jwplayer';
    const all = Array.from(document.querySelectorAll(selector));

    const extraPointers = Array.from(document.querySelectorAll("div, span, img")).filter((el) => {
      const s = window.getComputedStyle(el);
      return s.cursor === "pointer" || el.hasAttribute("onclick") || el.className.toString().includes("jw-");
    });

    const combined = Array.from(new Set([...all, ...extraPointers]));

    return combined.filter((el) => {
      if (el === cursorEl) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 14 || rect.height < 14) return false;
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return false;

      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") return false;

      return true;
    });
  }

  function setMagnetTarget(el) {
    document.querySelectorAll(".tv-magnet-target").forEach((e) => e.classList.remove("tv-magnet-target"));
    currentTargetEl = el;

    if (el) {
      el.classList.add("tv-magnet-target");
      const rect = el.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;
      updateCursorPos(targetX, targetY);

      if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  // 4. Mover e imantar
  function moveAndSnapMagnet(direction) {
    const candidates = getMagnetElements();

    if (candidates.length === 0) {
      let stepX = 0, stepY = 0;
      if (direction === "ArrowRight") stepX = 140;
      if (direction === "ArrowLeft") stepX = -140;
      if (direction === "ArrowDown") stepY = 140;
      if (direction === "ArrowUp") stepY = -140;
      updateCursorPos(cursorX + stepX, cursorY + stepY);
      return;
    }

    let bestCandidate = null;
    let minScore = Infinity;

    candidates.forEach((el) => {
      if (el === currentTargetEl) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = cx - cursorX;
      const dy = cy - cursorY;

      let inDirection = false;
      if (direction === "ArrowRight" && dx > 15) inDirection = true;
      if (direction === "ArrowLeft" && dx < -15) inDirection = true;
      if (direction === "ArrowDown" && dy > 15) inDirection = true;
      if (direction === "ArrowUp" && dy < -15) inDirection = true;

      if (inDirection) {
        const dist = Math.hypot(dx, dy);
        const anglePenalization =
          direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dy) * 1.6 : Math.abs(dx) * 1.6;
        const score = dist + anglePenalization;

        if (score < minScore) {
          minScore = score;
          bestCandidate = el;
        }
      }
    });

    if (bestCandidate) {
      setMagnetTarget(bestCandidate);
    } else {
      if (direction === "ArrowDown") window.scrollBy({ top: 280, behavior: "smooth" });
      if (direction === "ArrowUp") window.scrollBy({ top: -280, behavior: "smooth" });
      if (direction === "ArrowRight") updateCursorPos(cursorX + 140, cursorY);
      if (direction === "ArrowLeft") updateCursorPos(cursorX - 140, cursorY);
    }
  }

  // 5. Clic imantado con eventos de mouse reales para JWPlayer y Cuevana
  function performMagnetClick() {
    const x = cursorX;
    const y = cursorY;

    if (cursorEl) {
      cursorEl.style.transform = "translate(-50%, -50%) scale(1.6)";
      setTimeout(() => {
        if (cursorEl) cursorEl.style.transform = "translate(-50%, -50%) scale(1)";
      }, 150);
    }

    wakeUpMouseControls(x, y);

    let el = currentTargetEl || document.elementFromPoint(x, y);
    if (!el) return;

    // A. Intentar controlar reproductores JWPlayer / Video
    if (el.className.toString().includes("jw-") || el.closest(".jwplayer, .jw-media, video, iframe")) {
      controlAllVideos("media-toggle");
    }

    // B. Resolver elemento ejecutable o enlace a[href]
    const primaryClickable = el.closest("a[href], button, [role='button'], [onclick], .jw-media, .jw-reset, .ytd-thumbnail");
    const target = primaryClickable || el;

    const options = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
    target.dispatchEvent(new PointerEvent("pointerdown", options));
    target.dispatchEvent(new MouseEvent("mousedown", options));
    target.dispatchEvent(new PointerEvent("pointerup", options));
    target.dispatchEvent(new MouseEvent("mouseup", options));
    target.dispatchEvent(new MouseEvent("click", options));

    if (typeof target.click === "function") {
      target.click();
    }
  }

  // 6. Procesar comandos del control remoto
  function handleRemoteAction(data) {
    const key = data.key;
    const label = data.label || "";
    const type = data.type;

    if (["media-play", "media-pause", "media-toggle", "media-seek-back", "media-seek-forward"].includes(type)) {
      controlAllVideos(type);
      return;
    }

    if (key === "Enter" || label === "Seleccionar") {
      performMagnetClick();
      return;
    }

    if (key === "Escape" || key === "Backspace" || label === "Atrás") {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        window.history.back();
      }
      return;
    }

    if (key === " " || label === "Reproducir") {
      const handled = controlAllVideos("media-toggle");
      if (!handled) performMagnetClick();
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      moveAndSnapMagnet(key);
      return;
    }
  }

  // 7. Conexión WebSocket directa continua desde cada marco e iframe
  function connectDirectWs() {
    try {
      const ws = new WebSocket("ws://localhost:8081");

      ws.onopen = () => {
        console.log("[Apple TV Remote v4.1] Marco conectado a ws://localhost:8081");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRemoteAction(data);
        } catch (err) {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        setTimeout(connectDirectWs, 2500);
      };
    } catch (e) {
      setTimeout(connectDirectWs, 2500);
    }
  }

  connectDirectWs();

  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      handleRemoteAction(message);
    });
  }
})();
