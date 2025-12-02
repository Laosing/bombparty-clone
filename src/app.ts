import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import cors from "cors";

const rootDir = Deno.cwd();

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
