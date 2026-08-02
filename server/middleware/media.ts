import { eventHandler, getRequestHeader, setResponseHeaders, sendStream } from "h3";
import fs from "fs";
import path from "path";

export default eventHandler((event) => {
  const reqUrl = decodeURIComponent(event.node.req.url || "");
  const cleanPath = reqUrl.split("?")[0];

  if (cleanPath.startsWith("/Volumes/") || cleanPath.startsWith("/media/")) {
    let relPath = cleanPath;
    if (cleanPath.startsWith("/media/")) {
      relPath = cleanPath.replace(/^\/media\//, "");
    } else if (cleanPath.startsWith("/Volumes/")) {
      const parts = cleanPath.replace(/^\/Volumes\//, "").split("/");
      parts.shift();
      relPath = parts.join("/");
    }

    const candidatePaths: string[] = [
      cleanPath,
      path.join(process.cwd(), "public", "media", relPath),
    ];

    if (fs.existsSync("/Volumes")) {
      try {
        const volumes = fs.readdirSync("/Volumes");
        for (const vol of volumes) {
          if (vol === "Macintosh HD") continue;
          candidatePaths.push(path.join("/Volumes", vol, relPath));
          candidatePaths.push(path.join("/Volumes", vol, cleanPath));
        }
      } catch (e) {}
    }

    let filePath = "";
    for (const p of candidatePaths) {
      try {
        if (p && fs.existsSync(p) && fs.statSync(p).isFile()) {
          filePath = p;
          break;
        }
      } catch (e) {}
    }

    if (filePath) {
      const ext = path.extname(filePath).toLowerCase();

      // Convertir archivos de subtítulos .srt a WebVTT (.vtt) al vuelo para HTML5 video
      if (ext === ".srt" || ext === ".vtt") {
        const content = fs.readFileSync(filePath, "utf-8");
        const vttContent = ext === ".srt" 
          ? "WEBVTT\n\n" + content.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2")
          : content;

        setResponseHeaders(event, {
          "Content-Type": "text/vtt; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        return vttContent;
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = getRequestHeader(event, "range");

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
