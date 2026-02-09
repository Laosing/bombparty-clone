import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";
import game from "./socket/index.js";
import { logger } from "./utils/logger.js";
import { config } from "./config/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const clientBuildPath = path.join(projectRoot, "client/dist");

const port = parseInt(config.port as string) || 3000;

const allowedOrigins = config.nodeEnv === "production"
    ? [config.corsOrigin].filter(Boolean) as string[]
    : "*";

const io = new Server({
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6, // 1 MB
});

const engine = new Engine({
    path: "/socket.io/",
});

io.bind(engine);
game(io);

const { websocket, fetch: socketFetch } = engine.handler();

Bun.serve({
    port,
    websocket,
    async fetch(req, server) {
        const url = new URL(req.url);

        // Handle Socket.IO requests
        if (url.pathname.startsWith("/socket.io")) {
            return socketFetch(req, server);
        }

        // Serve static files from client/build
        let filePath = path.join(clientBuildPath, url.pathname);
        let file = Bun.file(filePath);

        if (await file.exists()) {
             // Handle directory request -> try index.html
             // (Bun.file check doesn't distinguish dir vs file easily without stat, but let's assume direct mapping first)
             // Actually, if it's a directory, file.exists() might be false depending on implementation or it might return the dir.
             // But simpler check:
             // If url ends with /, try index.html
             if (url.pathname.endsWith("/")) {
                 filePath = path.join(clientBuildPath, url.pathname, "index.html");
                 file = Bun.file(filePath);
             }
        }

        if (await file.exists()) {
            return new Response(file);
        }

        // Fallback for SPA: serve index.html for non-API, non-socket requests that didn't match a file
        // Exclude /api prefix if you have one (not in this project currently)
        const indexFile = Bun.file(path.join(clientBuildPath, "index.html"));
        if (await indexFile.exists()) {
             return new Response(indexFile);
        }

        return new Response("Not Found", { status: 404 });
    },
});

logger.info(`Server started, listening on port ${port}!`);
