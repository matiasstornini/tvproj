// Background Service Worker para la extensión de Control Remoto
let ws = null;

function connectWebSocket() {
  try {
    ws = new WebSocket("ws://localhost:8081");

    ws.onopen = () => {
      console.log("[Remote Extension] Conectado con éxito al servidor WebSocket (ws://localhost:8081)");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "key" || data.key) {
          // Reenviar la tecla/acción recibida del celular a la pestaña activa en Chrome (Cuevana, YouTube, etc.)
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, data).catch(() => {});
            }
          });
        }
      } catch (err) {}
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  } catch (e) {
    setTimeout(connectWebSocket, 3000);
  }
}

connectWebSocket();
