import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";

let wss: WebSocketServer | null = null;

export default defineConfig({
  vite: {
    server: {
      allowedHosts: true,
    },
    plugins: [
      {
        name: "local-media-and-remote-server",
        configureServer(server) {
          // 1. Servidor de Streaming para Archivos de Pendrive / Disco Local (/media/...)
          server.middlewares.use("/media", (req, res, next) => {
            const reqPath = decodeURIComponent(req.url || "").replace(/^\//, "");
            
            // Posibles ubicaciones de pendrives y almacenamiento local
            const candidatePaths = [
              path.join(process.cwd(), "public", "media", reqPath),
              path.join("/Volumes/Sin titulo", reqPath),
              path.join("/Volumes/Pendrive", reqPath),
              path.join("D:", "media", reqPath),
              path.join("E:", "media", reqPath),
              path.join("F:", "media", reqPath),
              path.join("G:", "media", reqPath),
            ];

            let filePath = "";
            for (const p of candidatePaths) {
              if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                filePath = p;
                break;
              }
            }

            if (filePath) {
              const stat = fs.statSync(filePath);
              const fileSize = stat.size;
              const range = req.headers.range;

              if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = end - start + 1;
                const file = fs.createReadStream(filePath, { start, end });

                res.writeHead(206, {
                  "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                  "Accept-Ranges": "bytes",
                  "Content-Length": chunksize,
                  "Content-Type": "video/mp4",
                  "Access-Control-Allow-Origin": "*",
                });
                file.pipe(res);
              } else {
                res.writeHead(200, {
                  "Content-Length": fileSize,
                  "Content-Type": "video/mp4",
                  "Access-Control-Allow-Origin": "*",
                });
                fs.createReadStream(filePath).pipe(res);
              }
              return;
            }

            next();
          });

          // 2. Servidor WebSocket para el Control Remoto (Puerto 8081)
          if (!wss) {
            try {
              wss = new WebSocketServer({ port: 8081 });
              console.log("[Remote Control WS] Servidor WebSocket activo en ws://localhost:8081");

              wss.on("connection", (ws) => {
                ws.on("message", (msg) => {
                  const dataStr = msg.toString();
                  try {
                    const parsed = JSON.parse(dataStr);
                    wss?.clients.forEach((client) => {
                      if (client.readyState === 1) {
                        client.send(dataStr);
                      }
                    });
                    server.ws.send("tv:control-event", parsed);
                  } catch (e) {}
                });
              });
            } catch (err) {
              console.log("[Remote Control WS] Error o puerto ocupado:", err);
            }
          }

          server.ws.on("tv:control", (data) => {
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
