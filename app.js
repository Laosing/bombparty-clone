import express from "express"
import path from "path"
import cookieParser from "cookie-parser"
import logger from "morgan"

import cors from "cors"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(cors())
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "client/build")))

app.get("/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client/build", "index.html"))
})

export { app }
