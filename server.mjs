// Node.js HTTP server wrapper for TanStack Start (Lovable/Nitro web-standard output)
import http from "http";
import { createRequire } from "module";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the server handler (web-standard fetch handler)
const { default: serverHandler } = await import("./dist/server/server.js");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Static file MIME types
const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".mp3":  "audio/mpeg",
  ".webp": "image/webp",
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  try {
    const isApiRequest = req.url.startsWith("/api/") || req.url.startsWith("/v1/");

    // Try serving static files from dist/client first for GET/HEAD non-API requests
    if (!isApiRequest && (req.method === "GET" || req.method === "HEAD")) {
      const clientDir = path.join(__dirname, "dist", "client");
      let staticPath = path.join(clientDir, req.url.split("?")[0]);

      if (existsSync(staticPath) && path.extname(staticPath)) {
        const data = await readFile(staticPath);
        res.writeHead(200, {
          "Content-Type": getMime(staticPath),
          "Cache-Control": path.extname(staticPath) === ".html" ? "no-cache" : "public, max-age=31536000",
        });
        return res.end(data);
      }
    }

    // Forward API and SSR requests to server handler
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(", ") : v;
    }

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const fetchReq = new Request(url.toString(), {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
    });

    const fetchRes = await serverHandler.fetch(fetchReq);

    res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers.entries()));
    const buf = await fetchRes.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🐟 FishFarm OS server running on http://${HOST}:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
