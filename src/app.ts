import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Because we moved app.ts to src/, __dirname will end with src/
// But client/build is in the root, so we need to go up one level.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "..");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(rootDir, "client/build")));

app.get("/*splat", (req, res) => {
  res.sendFile(path.resolve(rootDir, "client/build", "index.html"));
});

export { app };
