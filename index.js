#!/usr/bin/env node

import { Server } from "socket.io"
import http from "http"
import ansi from "ansi-colors"

import { app } from "./app.js"
import game from "./game.js"

const port = normalizePort(process.env.PORT || "8080")
app.set("port", port)

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  pingTimeout: 60000,
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
game(io)

const log = console.log
const colors = ["red", "blue", "yellow", "green", "magenta"]
colors.forEach(
  (color) =>
    (log[color] = (...msg) => log(ansi[color](`${[...msg].join(" : ")}`)))
)

httpServer.listen(port, () => {
  log.blue(`Server started, listening on port ${port}!`)
})
httpServer.on("error", onError)
httpServer.on("listening", onListening)

function normalizePort(val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges")
      process.exit(1)
      break
    case "EADDRINUSE":
      console.error(bind + " is already in use")
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening() {
  const addr = httpServer.address()
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port
  log("Listening on " + bind)
}

export { log }
