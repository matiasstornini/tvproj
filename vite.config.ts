import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export default defineConfig({
  vite: {
    server: {
      allowedHosts: true,
    },
    plugins: [
      {
        name: "remote-control-websocket-server",
        configureServer(server) {
          if (!wss) {
            try {
              wss = new WebSocketServer({ port: 8081 });
              console.log("[Remote Control WS] Servidor WebSocket activo en ws://localhost:8081");

              wss.on("connection", (ws) => {
                ws.on("message", (msg) => {
                  const dataStr = msg.toString();
                  try {
                    const parsed = JSON.parse(dataStr);
                    // Broadcast a clientes del puerto 8081 (Extensión de Chrome)
                    wss?.clients.forEach((client) => {
                      if (client.readyState === 1) {
                        client.send(dataStr);
                      }
                    });
                    // Retransmitir al teléfono en el puerto 8080 / Cloudflare Tunnel
                    server.ws.send("tv:control-event", parsed);
                  } catch (e) {}
                });
              });
            } catch (err) {
              console.log("[Remote Control WS] Error o puerto ocupado:", err);
            }
          }

          server.ws.on("tv:control", (data) => {
            // Forward de acciones del teléfono (puerto 8080) hacia la extensión (puerto 8081)
            if (wss) {
              const msgStr = JSON.stringify(data);
              wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                  client.send(msgStr);
                }
              });
            }
            server.ws.send("tv:control-event", data);
          });
        },
      },
    ],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
