"use strict";

try { process.loadEnvFile(); } catch (error) { if (error.code !== "ENOENT") throw error; }

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const handleApi = require("./api/handler");

const root = path.join(__dirname, "public");
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".jpeg":"image/jpeg" };
const server = http.createServer((req,res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) return handleApi(req,res);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end("Bad request"); return; }
  if (pathname === "/") pathname = "/index.html";
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep) || pathname.split("/").some(part => part.startsWith("."))) { res.writeHead(404).end("Not found"); return; }
  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) { res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"}).end("Page not found"); return; }
    res.writeHead(200, {"Content-Type":mime[path.extname(file).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options":"nosniff", "Referrer-Policy":"strict-origin-when-cross-origin"});
    fs.createReadStream(file).pipe(res);
  });
});
const port = Number(process.env.PORT || 4173);
server.listen(port, "0.0.0.0", () => console.log(`BuyFarm is running on http://localhost:${port}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
