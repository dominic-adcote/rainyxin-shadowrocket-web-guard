import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "9999", 10);

const files = new Map([
  ["/", "index.html"],
  ["/blocked", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
  ["/core.mjs", "core.mjs"],
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'none'; connect-src 'none'; font-src 'self'; form-action 'none'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  if (!["GET", "HEAD"].includes(method)) {
    response.writeHead(405, {
      ...securityHeaders,
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  );

  if (requestUrl.pathname === "/healthz") {
    response.writeHead(200, {
      ...securityHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(method === "HEAD" ? undefined : '{"status":"ok"}\n');
    return;
  }

  const relativeFile = files.get(requestUrl.pathname);
  if (!relativeFile) {
    response.writeHead(404, {
      ...securityHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(method === "HEAD" ? undefined : "Not Found");
    return;
  }

  try {
    const body = await readFile(resolve(root, relativeFile));
    const isHtml = extname(relativeFile) === ".html";
    response.writeHead(200, {
      ...securityHeaders,
      "Cache-Control": isHtml
        ? "no-store"
        : "public, max-age=3600, must-revalidate",
      "Content-Type": mimeTypes[extname(relativeFile)],
    });
    response.end(method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(500, {
      ...securityHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(method === "HEAD" ? undefined : "Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Adcote block page listening on http://${host}:${port}`);
});
