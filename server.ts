import { createServer } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { PORT, DEFAULT_PROJECT_DIR } from "./lib/server/env";
import { checkAuth } from "./lib/server/auth";
import { handleConnection } from "./lib/server/wsHandlers";
import { getMcpServersCached } from "./lib/server/mcp";
import { startStallDetection } from "./lib/server/stallDetection";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const nextHandler = app.getRequestHandler();

const wss = new WebSocketServer({ noServer: true });

app.prepare().then(() => {
  const server = createServer((req, res) => {
    if (!checkAuth(req)) {
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="agent-webapp"' });
      res.end("Auth required");
      return;
    }
    // `/` is statically prerendered, so Next serves it with `s-maxage=31536000`
    // (a year) and no revalidation directive — fine behind a CDN, but here the
    // phone's own browser is the only cache in front of this server, and it was
    // happily serving a stale build after every redeploy with no way to tell.
    // The original server.js explicitly overrode this for exactly that reason;
    // port it forward by rewriting whatever Cache-Control Next sets for the
    // document itself (never for /_next/static/*, which is content-hashed and
    // SHOULD stay cached forever).
    if (!req.url?.startsWith("/_next/static/")) {
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = ((name: string, value: number | string | readonly string[]) => {
        if (typeof name === "string" && name.toLowerCase() === "cache-control") {
          return originalSetHeader(name, "no-cache, must-revalidate");
        }
        return originalSetHeader(name, value);
      }) as typeof res.setHeader;
    }
    nextHandler(req, res);
  });

  function handleUpgrade(req: import("node:http").IncomingMessage, socket: import("node:net").Socket, head: Buffer) {
    if (!checkAuth(req)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  }

  // Next's request handler lazily registers its own 'upgrade' listener on this
  // same http.Server the first time it serves a real page (confirmed directly:
  // server.listenerCount('upgrade') goes from 1 to 2 right after the first page
  // load). That second listener doesn't recognize our WS upgrades and destroys
  // the socket — Node calls every 'upgrade' listener for the same event, so our
  // handler's successful handshake gets torn down microseconds later by Next's.
  // This was the actual cause of the "Disconnected — reconnecting…" loop: every
  // connection opened fine and then died with code 1006 within milliseconds.
  // Fix: keep our handler the only 'upgrade' listener this server ever has.
  const originalOn = server.on.bind(server);
  server.on = ((event: string, listener: (...args: unknown[]) => void) => {
    if (event === "upgrade" && listener !== handleUpgrade) return server;
    return originalOn(event, listener);
  }) as typeof server.on;

  server.on("upgrade", handleUpgrade);

  wss.on("connection", handleConnection);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`agent-webapp-next listening on http://0.0.0.0:${PORT}, default project: ${DEFAULT_PROJECT_DIR}`);
  });

  // Pre-warm the MCP status cache in the background so the first real request
  // (opening the panel) hits a warm cache instead of paying the ~14s scan itself.
  getMcpServersCached().catch((e) => console.error("MCP pre-warm failed:", e.message));

  startStallDetection();
});
