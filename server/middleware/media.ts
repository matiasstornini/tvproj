import { eventHandler, getRequestHeader, setResponseHeaders, sendStream } from "h3";
import fs from "fs";
import path from "path";

export default eventHandler((event) => {
  const reqUrl = decodeURIComponent(event.node.req.url || "");
  const cleanPath = reqUrl.split("?")[0];

  if (cleanPath.startsWith("/Volumes/") || cleanPath.startsWith("/media/")) {
    let candidatePaths: string[] = [];

    if (cleanPath.startsWith("/Volumes/")) {
      candidatePaths = [
        cleanPath,
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
      const range = getRequestHeader(event, "range");

      const ext = path.extname(filePath).toLowerCase();
      let contentType = "video/mp4";
      if (ext === ".mkv") contentType = "video/x-matroska";
      if (ext === ".m3u8") contentType = "application/x-mpegURL";
      if (ext === ".webm") contentType = "video/webm";

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const stream = fs.createReadStream(filePath, { start, end });

        setResponseHeaders(event, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        event.node.res.statusCode = 206;
        return sendStream(event, stream);
      } else {
        setResponseHeaders(event, {
          "Content-Length": String(fileSize),
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        event.node.res.statusCode = 200;
        return sendStream(event, fs.createReadStream(filePath));
      }
    }
  }
});
