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
          // 1. Servidor de Streaming Nativo para Archivos del Pendrive de la Mac (/Volumes/... y /media/...)
          server.middlewares.use((req, res, next) => {
            const reqUrl = decodeURIComponent(req.url || "");
            const cleanPath = reqUrl.split("?")[0];
            
            if (cleanPath.startsWith("/media/") || cleanPath.startsWith("/Volumes/")) {
              let candidatePaths: string[] = [];

              if (cleanPath.startsWith("/Volumes/")) {
                candidatePaths = [
                  cleanPath, // Ruta exacta en la Mac: /Volumes/Sin titulo/suits/s07e01.mp4
                  path.join("/Volumes", cleanPath.replace(/^\/Volumes\//, "")),
                ];
              } else {
                const relPath = cleanPath.replace(/^\/media\//, "");
                candidatePaths = [
                  path.join("/Volumes/Sin titulo", relPath),
                  path.join("/Volumes/Pendrive", relPath),
                  path.join(process.cwd(), "public", "media", relPath),
                ];
              }

              let filePath = "";
              for (const p of candidatePaths) {
                try {
                  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                    filePath = p;
                    break;
                  }
                } catch (e) {}
              }

              if (filePath) {
                const stat = fs.statSync(filePath);
                const fileSize = stat.size;
                const range = req.headers.range;

                const ext = path.extname(filePath).toLowerCase();
                let contentType = "video/mp4";
                if (ext === ".mkv") contentType = "video/x-matroska";
                if (ext === ".m3u8") contentType = "application/x-mpegURL";
                if (ext === ".webm") contentType = "video/webm";

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
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                  });
                  file.pipe(res);
                } else {
                  res.writeHead(200, {
                    "Content-Length": fileSize,
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                  });
                  fs.createReadStream(filePath).pipe(res);
                }
                return; // Cortar aquí la petición para evitar que devuelva el HTML de TanStack Router
              }
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
